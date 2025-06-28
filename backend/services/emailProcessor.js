import Imap from 'imap';
import { simpleParser } from 'mailparser';
import pdf from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import Tesseract from 'tesseract.js';
import supabase from '../supabaseClient.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailProcessor {
  constructor() {
    this.imap = new Imap({
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: process.env.EMAIL_HOST || 'imap.gmail.com',
      port: process.env.EMAIL_PORT || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  // Start monitoring emails
  async startMonitoring() {
    console.log('Starting email monitoring...');
    
    this.imap.once('ready', () => {
      this.openInbox();
    });

    this.imap.once('error', (err) => {
      console.error('IMAP error:', err);
    });

    this.imap.once('end', () => {
      console.log('IMAP connection ended');
    });

    this.imap.connect();
  }

  // Open inbox and search for new emails
  openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }

      // Search for unread emails from specified sender
      const searchCriteria = [
        ['UNSEEN'],
        ['FROM', process.env.GOVERNMENT_EMAIL || 'sgid@icf.gov.in']
      ];

      this.imap.search(searchCriteria, (err, results) => {
        if (err) {
          console.error('Search error:', err);
          return;
        }

        if (results.length === 0) {
          console.log('No new emails found');
          this.imap.end();
          return;
        }

        console.log(`Found ${results.length} new email(s)`);
        this.fetchEmails(results);
      });
    });
  }

  // Fetch and process emails
  fetchEmails(results) {
    const fetch = this.imap.fetch(results, { bodies: '', struct: true });

    fetch.on('message', (msg, seqno) => {
      console.log(`Processing message #${seqno}`);

      msg.on('body', (stream, info) => {
        simpleParser(stream, async (err, parsed) => {
          if (err) {
            console.error('Email parsing error:', err);
            return;
          }

          await this.processEmail(parsed);
        });
      });
    });

    fetch.once('error', (err) => {
      console.error('Fetch error:', err);
    });

    fetch.once('end', () => {
      console.log('Done fetching all messages');
      this.imap.end();
    });
  }

  // Process individual email
  async processEmail(parsedEmail) {
    try {
      // Check if email subject matches
      if (parsedEmail.subject !== 'Sale Confirmation of FP Bales') {
        console.log('Email subject does not match, skipping:', parsedEmail.subject);
        return;
      }

      // Check for PDF attachments
      const pdfAttachments = parsedEmail.attachments.filter(
        attachment => attachment.contentType === 'application/pdf'
      );

      if (pdfAttachments.length === 0) {
        console.log('No PDF attachments found');
        await this.logEmailProcessing(parsedEmail, false, null, 'No PDF attachment found');
        return;
      }

      // Process each PDF attachment
      for (const attachment of pdfAttachments) {
        await this.processPdfAttachment(parsedEmail, attachment);
      }

    } catch (error) {
      console.error('Error processing email:', error);
      await this.logEmailProcessing(parsedEmail, false, null, error.message);
    }
  }

  // Process PDF attachment
  async processPdfAttachment(parsedEmail, attachment) {
    try {
      // Generate filename with naming convention
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const mainFilename = `${new Date().getFullYear()}_Cotton_Sale_${timestamp}_Allocation_A.pdf`;
      const backupFilename = `Riddhi_Siddhi_File_${timestamp}.pdf`;

      // Save PDF to temporary location
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPath = path.join(tempDir, mainFilename);
      fs.writeFileSync(tempPath, attachment.content);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('allocation-pdfs')
        .upload(mainFilename, attachment.content, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('allocation-pdfs')
        .getPublicUrl(mainFilename);

      // Log email processing
      const emailLog = await this.logEmailProcessing(
        parsedEmail, 
        true, 
        mainFilename, 
        null,
        publicUrl
      );

      // Parse PDF content
      const parsedData = await this.parsePdfContent(tempPath);

      // Extract structured data
      const extractedData = await this.extractAllocationData(parsedData);

      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData);

      // Save to database
      await this.saveAllocationData(extractedData, confidence, emailLog.id, mainFilename, publicUrl);

      // Clean up temp file
      fs.unlinkSync(tempPath);

    } catch (error) {
      console.error('Error processing PDF attachment:', error);
      await this.logEmailProcessing(parsedEmail, false, null, error.message);
    }
  }

  // Parse PDF content using OCR
  async parsePdfContent(pdfPath) {
    try {
      // Convert PDF to images
      const options = {
        density: 300,
        saveFilename: "page",
        savePath: path.dirname(pdfPath),
        format: "png",
        width: 2480,
        height: 3508
      };

      const convert = fromPath(pdfPath, options);
      const pageData = await convert(1); // Convert first page

      // Extract text using OCR
      const { data: { text } } = await Tesseract.recognize(
        pageData.path,
        'eng',
        { logger: m => console.log(m) }
      );

      // Clean up image file
      fs.unlinkSync(pageData.path);

      return text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw error;
    }
  }

  // Extract structured data from parsed text
  async extractAllocationData(parsedText) {
    try {
      // Use regex patterns to extract data
      const patterns = {
        indent_number: /Indent\s*Number[:\s]*([A-Z0-9-]+)/i,
        buyer_type: /Buyer\s*Type[:\s]*([A-Za-z\s]+)/i,
        buyer_name: /Buyer\s*Name[:\s]*([A-Za-z\s]+)/i,
        center_name: /Center\s*Name[:\s]*([A-Za-z\s]+)/i,
        branch: /Branch[:\s]*([A-Za-z\s]+)/i,
        date_of_allocation: /Date\s*of\s*Allocation[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
        firm_name: /Firm\s*Name[:\s]*([A-Za-z\s]+)/i,
        variety: /Variety[:\s]*([A-Za-z\s]+)/i,
        bales_quantity: /Bales\s*Quantity[:\s]*(\d+)/i,
        crop_year: /Crop\s*Year[:\s]*(\d{4})/i,
        offer_price: /Offer\s*Price[:\s]*([\d,]+\.?\d*)/i,
        bid_price: /Bid\s*Price[:\s]*([\d,]+\.?\d*)/i,
        lifting_period: /Lifting\s*Period[:\s]*(\d+)/i,
        fibre_length: /Fibre\s*Length[:\s]*([\d.]+)/i,
        cotton_fibre_specification: /Cotton\s*Fibre\s*Specification[:\s]*([^\n]+)/i,
        ccl_discount: /CCL\s*Discount[:\s]*([\d.]+)/i
      };

      const extractedData = {};

      for (const [key, pattern] of Object.entries(patterns)) {
        const match = parsedText.match(pattern);
        if (match) {
          extractedData[key] = match[1].trim();
        } else {
          extractedData[key] = null;
        }
      }

      // Clean and validate data
      if (extractedData.date_of_allocation) {
        // Convert date format
        const dateParts = extractedData.date_of_allocation.split(/[\/-]/);
        if (dateParts.length === 3) {
          extractedData.date_of_allocation = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
        }
      }

      // Convert numeric fields
      if (extractedData.bales_quantity) {
        extractedData.bales_quantity = parseInt(extractedData.bales_quantity);
      }
      if (extractedData.offer_price) {
        extractedData.offer_price = parseFloat(extractedData.offer_price.replace(/,/g, ''));
      }
      if (extractedData.bid_price) {
        extractedData.bid_price = parseFloat(extractedData.bid_price.replace(/,/g, ''));
      }
      if (extractedData.lifting_period) {
        extractedData.lifting_period = parseInt(extractedData.lifting_period);
      }
      if (extractedData.fibre_length) {
        extractedData.fibre_length = parseFloat(extractedData.fibre_length);
      }
      if (extractedData.ccl_discount) {
        extractedData.ccl_discount = parseFloat(extractedData.ccl_discount);
      }

      return extractedData;
    } catch (error) {
      console.error('Data extraction error:', error);
      throw error;
    }
  }

  // Calculate confidence score based on extracted data
  calculateConfidence(extractedData) {
    const requiredFields = [
      'indent_number', 'buyer_type', 'buyer_name', 'center_name', 
      'branch', 'date_of_allocation', 'firm_name', 'variety', 
      'bales_quantity', 'crop_year', 'offer_price', 'bid_price'
    ];

    const extractedFields = requiredFields.filter(field => 
      extractedData[field] !== null && extractedData[field] !== undefined
    );

    return (extractedFields.length / requiredFields.length) * 100;
  }

  // Save allocation data to database
  async saveAllocationData(extractedData, confidence, emailLogId, pdfFilename, pdfUrl) {
    try {
      const status = confidence > 80 ? 'approved' : 'pending_review';

      const { data, error } = await supabase
        .from('allocation_table')
        .insert([{
          ...extractedData,
          parsing_confidence: confidence,
          status: status,
          created_by: 'system',
          pdf_filename: pdfFilename,
          pdf_url: pdfUrl
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log processing step
      await supabase
        .from('processing_logs')
        .insert([{
          email_log_id: emailLogId,
          processing_stage: 'data_extraction',
          status: confidence > 80 ? 'success' : 'warning',
          message: `Data extracted with ${confidence}% confidence`,
          details: extractedData
        }]);

      console.log(`Allocation data saved with ${confidence}% confidence`);

      // Update email log
      await supabase
        .from('email_logs')
        .update({
          processing_status: status,
          parsing_confidence: confidence
        })
        .eq('id', emailLogId);

      return data;
    } catch (error) {
      console.error('Error saving allocation data:', error);
      throw error;
    }
  }

  // Log email processing
  async logEmailProcessing(parsedEmail, hasPdf, pdfFilename, errorMessage, pdfUrl = null) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert([{
          email_subject: parsedEmail.subject,
          sender_email: parsedEmail.from?.text || parsedEmail.from?.value?.[0]?.address,
          received_at: parsedEmail.date,
          has_pdf: hasPdf,
          pdf_filename: pdfFilename,
          pdf_s3_url: pdfUrl,
          processing_status: hasPdf ? 'received' : 'failed',
          error_message: errorMessage
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log processing step
      await supabase
        .from('processing_logs')
        .insert([{
          email_log_id: data.id,
          processing_stage: 'email_reception',
          status: hasPdf ? 'success' : 'error',
          message: hasPdf ? 'Email received and logged' : errorMessage
        }]);

      return data;
    } catch (error) {
      console.error('Error logging email processing:', error);
      throw error;
    }
  }
}

export default EmailProcessor; 
import os
from PyPDF2 import PdfReader
from docx import Document


class TextExtractor:
    def __init__(self, file_path):
        self.file_path = file_path
        
    def extract_text(self):
        if self.file_path.endswith('.pdf'):
            return self.extract_text_from_pdf()
        elif self.file_path.endswith('.docx'):
            return self.extract_text_from_docx()
        else:
            raise ValueError('Unsupported file format')
        
    def extract_text_from_pdf(self):
        with open(self.file_path, 'rb') as file:
            reader = PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text()
            return text
        
    def extract_text_from_docx(self):
        doc = Document(self.file_path)
        text = ''
        for para in doc.paragraphs:
            text += para.text
        return text
    
    
if __name__ == "__main__":
        # Example usage:
    file_path = "example.pdf"  # Replace with your file path
    try:
        extractor = TextExtractor(file_path)
        text = extractor.extract_text()
        print(f"Extracted text from {file_path}:\n{text}")
    except Exception as e:
        print(f"Error: {e}")


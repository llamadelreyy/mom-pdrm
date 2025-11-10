from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Body, Query, Form, Depends, HTTPException, status, Cookie
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer
from typing import Optional
from bs4 import BeautifulSoup
from docx.enum.text import WD_COLOR_INDEX
import os
import shutil
import logging
from pathlib import Path
import uuid
import requests
import markdown
from markdown import markdown as md_to_html
from weasyprint import HTML
from docx import Document
import re
import asyncio
import json

# Import the AudioTranscriber class from transcribe_audio module
from transcribe_audio import AudioTranscriber

# Import auth module
from auth import (
    authenticate_user, create_user, get_current_user_from_token, create_tokens,
    UserCreate, UserLogin, Token, verify_token
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM configuration
LLM_MODEL = "llm_model"
LLM_ADDRESS = "http://60.51.17.97:9501/v1/chat/completions"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Log that the service is starting
    logger.info("Starting up Audio Transcription Service")
    yield
    # Shutdown: Log that the service is shutting down
    logger.info("Shutting down Audio Transcription Service")

# Setup security
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(
    title="Audio Transcription Service",
    description="A service that transcribes audio files using the AudioTranscriber class",
    version="1.0.0",
    lifespan=lifespan
)

async def get_current_user(request: Request, access_token: Optional[str] = Cookie(None)):
    """Dependency to get the current user from JWT token."""
    # Allow access to login and register pages without authentication
    if any(path in str(request.url) for path in ["/login", "/register", "/static/", "/downloads/"]):
        return None
    
    # Check for token in cookie first, then in Authorization header
    token = access_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_current_user_from_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return current_user

# Mount static files directory
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")
# Mount downloads directory
downloads_path = Path(__file__).parent / "downloads"
downloads_path.mkdir(exist_ok=True)
logger.info(f"Downloads directory path: {downloads_path.absolute()}")
logger.info(f"Downloads directory exists: {downloads_path.exists()}")
app.mount("/downloads", StaticFiles(directory = downloads_path), name="downloads")
# Setup templates
# Setup templates with custom filter for Jinja2
templates = Jinja2Templates(directory=Path(__file__).parent / "static")

# Add custom filter to format datetime
templates.env.filters['datetime'] = lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if x else ''

# Create necessary directories
UPLOAD_DIR = Path(__file__).parent/"uploads"
TRANSCRIPTION_DIR = Path(__file__).parent/"transcriptions"
DOWNLOAD_DIR = downloads_path
UPLOAD_DIR.mkdir(exist_ok=True)
TRANSCRIPTION_DIR.mkdir(exist_ok=True)
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Initialize the AudioTranscriber
transcriber = AudioTranscriber()

# Progress tracking
progress_store = {}

@app.get("/", response_class=HTMLResponse)
async def root(request: Request, current_user: dict = Depends(get_current_active_user)):
    """
    Root endpoint serving the HTML interface for the transcription service.
    """
    return templates.TemplateResponse("index.html", {"request": request, "user": current_user})

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions, specifically for authentication errors."""
    if exc.status_code == 401:
        # Redirect to login page for unauthorized access
        return RedirectResponse(url="/login")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.get("/logout")
async def logout():
    """Handle logout by clearing cookie and redirecting to login page."""
    response = RedirectResponse(url="/login")
    response.delete_cookie("access_token")
    return response

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Serve the login page."""
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    """Serve the registration page."""
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register")
async def register(user_data: UserCreate):
    """Handle user registration."""
    try:
        user = create_user(user_data)
        return JSONResponse(
            content={"message": "User created successfully", "username": user["username"]},
            status_code=201
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/token")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Handle login form submission and return JWT tokens."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Incorrect username or password"},
            status_code=401
        )
    
    # Create tokens
    tokens = create_tokens(user)
    
    # Create response and set token in secure cookie
    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=1800,  # 30 minutes
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    return response

@app.post("/api/login")
async def api_login(user_credentials: UserLogin):
    """Handle API login and return JWT tokens."""
    user = authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = create_tokens(user)
    return tokens

@app.get("/api/info")
async def api_info():
    """
    API information endpoint for JSON data about the service.
    """
    return {
        "message": "Audio Transcription Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /transcribe": "Transcribe an uploaded audio file",
            "GET /health": "Check the health status of the service"
        }
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return {"status": "healthy"}

@app.get("/progress/{request_id}")
async def get_progress(request_id: str):
    """Stream progress updates for a specific request."""
    
    async def generate():
        while True:
            if request_id in progress_store:
                progress_data = progress_store[request_id]
                yield f"data: {json.dumps(progress_data)}\n\n"
                
                # If completed, send final message and cleanup
                if progress_data.get('completed', False):
                    del progress_store[request_id]
                    break
            else:
                # Send heartbeat if no progress yet
                yield f"data: {json.dumps({'status': 'waiting', 'message': 'Initializing...'})}\n\n"
            
            await asyncio.sleep(0.5)  # Update every 500ms
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.post("/process_text")
async def process_text(
    text: str = Form(...),
    output_format: str = Query("pdf", regex="^(pdf|docx|txt)$")
):
    """
    Endpoint to process text input and return downloadable files in multiple formats.
    
    Args:
        text: The text to process
        output_format: The desired output file format (pdf, docx, or txt)
    
    Returns:
        JSON response with download URLs for all file formats
    """
    try:
        logger.info(f"Text : {text}")
        html = markdown.markdown(text, extensions=['tables'])
        logger.info(f"HTML : {html}")
        
        # Generate all file formats
        pdf_path = generate_pdf(html)
        docx_path = generate_docx(html)
        txt_path = generate_txt(text)
        
        # Create download URLs
        return JSONResponse({
            "pdf_url": f"/downloads/{pdf_path.name}",
            "docx_url": f"/downloads/{docx_path.name}",
            "txt_url": f"/downloads/{txt_path.name}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

def generate_txt(text: str) -> Path:
    """Generate a TXT file from text content."""
    # Generate unique filename
    filename = f"document_{uuid.uuid4().hex[:8]}.txt"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving TXT to: {file_path.absolute()}")
    
    # Save the text file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    
    logger.info(f"TXT file exists after save: {file_path.exists()}")
    
    return file_path
    
def generate_pdf(text: str) -> Path:
    """Generate a PDF file from text content."""
    # Create HTML content with basic styling
    html_content = f"""
    <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #333; }}
                h2 {{ color: #444; }}
                p {{ line-height: 1.6; }}
                code {{ background: #f4f4f4; padding: 2px 5px; }}
                pre {{ background: #f4f4f4; padding: 10px; overflow: auto; }}
            </style>
        </head>
        <body>
            {text}
        </body>
    </html>
    """
    
    # Generate unique filename
    filename = f"document_{uuid.uuid4().hex[:8]}.pdf"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving PDF to: {file_path.absolute()}")
    
    # Convert HTML to PDF
    HTML(string=html_content).write_pdf(str(file_path))
    
    logger.info(f"PDF file exists after save: {file_path.exists()}")
    
    return file_path

def generate_docx(text: str) -> Path:
    """Generate a DOCX file from text content."""
    # Create a new Document
    doc = Document()
    
    # Clear default paragraph
    for paragraph in doc.paragraphs:
        p = paragraph._element
        p.getparent().remove(p)
    
    # Parse HTML and add content with formatting
    soup = BeautifulSoup(text, 'html.parser')
    
    for element in soup.children:
        if element.name == 'h1':
            doc.add_heading(element.get_text(), level=1)
        elif element.name == 'h2':
            doc.add_heading(element.get_text(), level=2)
        elif element.name == 'p':
            # Handle paragraphs with potential inline formatting
            p = doc.add_paragraph()
            for child in element.children:
                if hasattr(child, 'name'):
                    if child.name == 'strong' or child.name == 'b':
                        p.add_run(child.get_text()).bold = True
                    elif child.name == 'em' or child.name == 'i':
                        p.add_run(child.get_text()).italic = True
                    elif child.name == 'code':
                        p.add_run(child.get_text()).font.highlight_color = WD_COLOR_INDEX.GRAY_25
                    else:
                        p.add_run(child.get_text())
                else:
                    p.add_run(str(child))
        elif element.name == 'ul':
            for li in element.find_all('li', recursive=False):
                doc.add_paragraph(li.get_text(), style='List Bullet')
        elif element.name == 'ol':
            for li in element.find_all('li', recursive=False):
                doc.add_paragraph(li.get_text(), style='List Number')
    
        # Handle table elements
        elif element.name == 'table':
            # Find all rows in the table
            rows = element.find_all('tr')
            if rows:
                # Create table with same number of rows and columns
                table = doc.add_table(rows=len(rows), cols=len(rows[0].find_all(['th', 'td'])))
                table.style = 'Table Grid'
                
                for i, row in enumerate(rows):
                    cells = row.find_all(['th', 'td'])
                    for j, cell in enumerate(cells):
                        table_cell = table.cell(i, j)
                        # Clear any existing paragraphs
                        for paragraph in table_cell.paragraphs:
                            p = paragraph._element
                            p.getparent().remove(p)
                        
                        # Add cell content with formatting (similar to regular paragraphs)
                        for child in cell.children:
                            if hasattr(child, 'name'):
                                if child.name == 'strong' or child.name == 'b':
                                    table_cell.add_paragraph().add_run(child.get_text()).bold = True
                                elif child.name == 'em' or child.name == 'i':
                                    table_cell.add_paragraph().add_run(child.get_text()).italic = True
                                elif child.name == 'code':
                                    table_cell.add_paragraph().add_run(child.get_text()).font.highlight_color = WD_COLOR_INDEX.GRAY_25
                                else:
                                    table_cell.add_paragraph().add_run(child.get_text())
                            else:
                                table_cell.add_paragraph().add_run(str(child))
        
    # Generate unique filename
    filename = f"document_{uuid.uuid4().hex[:8]}.docx"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving DOCX to: {file_path.absolute()}")
    
    # Save the document
    doc.save(str(file_path))
    
    logger.info(f"DOCX file exists after save: {file_path.exists()}")
    
    return file_path

def generate_pdrm_docx_from_markdown(markdown_text: str, meta: dict, logo_path: str = "") -> Path:
    """Generate DOCX directly from markdown text to avoid HTML parsing issues."""
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    import re
    
    # Create a new Document
    doc = Document()
    
    # Set Arial font as default
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    
    # Clear default paragraph
    for paragraph in doc.paragraphs:
        p = paragraph._element
        p.getparent().remove(p)
    
    # Add header section
    # Logo (if available)
    if logo_path and os.path.exists(logo_path):
        try:
            header_para = doc.add_paragraph()
            header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = header_para.runs[0] if header_para.runs else header_para.add_run()
            run.add_picture(logo_path, height=Inches(1.67))  # 120px ≈ 1.67 inches
        except Exception:
            pass  # Skip logo if there's an issue
    
    # Title (H1 style: 12pt, bold, uppercase, underlined)
    if meta.get('title_text'):
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(meta['title_text'].upper())
        title_run.font.name = 'Arial'
        title_run.font.size = Pt(12)
        title_run.font.bold = True
        title_run.font.underline = True
        title_para.space_after = Pt(8)
    
    # Reference
    if meta.get('rujukan'):
        ref_para = doc.add_paragraph()
        ref_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        ref_run = ref_para.add_run(f"Rujukan: {meta['rujukan']}")
        ref_run.font.name = 'Arial'
        ref_run.font.size = Pt(11)
        ref_run.font.bold = True
        ref_para.space_after = Pt(12)
    
    # Metadata table
    meta_fields = [
        ('Bil. Mesyuarat', meta.get('bil')),
        ('Tarikh', meta.get('tarikh')),
        ('Masa', meta.get('masa')),
        ('Tempat', meta.get('tempat'))
    ]
    
    # Only add metadata if we have any values
    meta_to_add = [(k, v) for k, v in meta_fields if v]
    if meta_to_add:
        meta_table = doc.add_table(rows=len(meta_to_add), cols=2)
        meta_table.allow_autofit = True
        
        for i, (label, value) in enumerate(meta_to_add):
            row = meta_table.rows[i]
            
            # Label cell
            label_cell = row.cells[0]
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.font.name = 'Arial'
            label_run.font.size = Pt(11)
            label_run.font.bold = True
            label_cell.width = Inches(1.8)
            
            # Value cell
            value_cell = row.cells[1]
            value_para = value_cell.paragraphs[0]
            value_run = value_para.add_run(f": {value}")
            value_run.font.name = 'Arial'
            value_run.font.size = Pt(11)
        
        # Add space after metadata table
        meta_para = doc.add_paragraph()
        meta_para.space_after = Pt(12)
    
    # Process markdown text line by line
    lines = markdown_text.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
        
        # Handle headings
        if line.startswith('#'):
            level = len(line) - len(line.lstrip('#'))
            heading_text = line.lstrip('#').strip()
            
            heading = doc.add_heading(heading_text, level=min(level, 3))
            heading.runs[0].font.name = 'Arial'
            if level == 1:
                heading.runs[0].font.size = Pt(12)
                heading.runs[0].font.bold = True
                heading.runs[0].font.underline = True
            elif level == 2:
                heading.runs[0].font.size = Pt(12)
                heading.runs[0].font.bold = True
            else:
                heading.runs[0].font.size = Pt(11)
                heading.runs[0].font.bold = True
        
        # Handle numbered lists and content
        elif re.match(r'^\d+\.', line):
            # This is a numbered item
            para = doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            # Extract number and text
            parts = line.split('.', 1)
            if len(parts) == 2:
                number = parts[0].strip()
                text = parts[1].strip()
                
                # Add number in bold
                num_run = para.add_run(f"{number}. ")
                num_run.font.name = 'Arial'
                num_run.font.size = Pt(11)
                num_run.font.bold = True
                
                # Process text for action tags
                # Look for **[action_tag]** pattern
                action_pattern = r'\*\*\[([^\]]+)\]\*\*'
                
                if '**[' in text:
                    # Split text by action tags
                    parts = re.split(action_pattern, text)
                    
                    for j, part in enumerate(parts):
                        if j % 2 == 0:  # Regular text
                            if part.strip():
                                text_run = para.add_run(part)
                                text_run.font.name = 'Arial'
                                text_run.font.size = Pt(11)
                        else:  # Action tag
                            tag_run = para.add_run(f" **[{part}]**")
                            tag_run.font.name = 'Arial'
                            tag_run.font.size = Pt(11)
                            tag_run.font.bold = True
                else:
                    # No action tags, just add text
                    text_run = para.add_run(text)
                    text_run.font.name = 'Arial'
                    text_run.font.size = Pt(11)
        
        # Handle sub-items (1.1, 1.2, etc.)
        elif re.match(r'^\d+\.\d+', line):
            para = doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            para.left_indent = Inches(0.5)  # Indent sub-items
            
            # Add the whole line as is
            text_run = para.add_run(line)
            text_run.font.name = 'Arial'
            text_run.font.size = Pt(11)
        
        # Handle bullet points
        elif line.startswith('-') or line.startswith('*'):
            para = doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            text = line[1:].strip()  # Remove bullet
            
            # Add bullet
            bullet_run = para.add_run("• ")
            bullet_run.font.name = 'Arial'
            bullet_run.font.size = Pt(11)
            
            # Add text
            text_run = para.add_run(text)
            text_run.font.name = 'Arial'
            text_run.font.size = Pt(11)
        
        # Handle regular paragraphs
        else:
            para = doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            # Process text for formatting
            if '**' in line:
                parts = line.split('**')
                for j, part in enumerate(parts):
                    run = para.add_run(part)
                    run.font.name = 'Arial'
                    run.font.size = Pt(11)
                    if j % 2 == 1:  # Odd indices are bold
                        run.font.bold = True
            else:
                text_run = para.add_run(line)
                text_run.font.name = 'Arial'
                text_run.font.size = Pt(11)
        
        i += 1
    
    # Generate unique filename
    filename = f"pdrm_minutes_{uuid.uuid4().hex[:8]}.docx"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving PDRM DOCX to: {file_path.absolute()}")
    
    # Save the document
    doc.save(str(file_path))
    
    logger.info(f"PDRM DOCX file exists after save: {file_path.exists()}")
    
    return file_path

def generate_pdrm_docx(body_html: str, meta: dict, logo_path: str = "") -> Path:
    """Generate a DOCX file with PDRM meeting minutes format - simplified version."""
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    
    # Create a new Document
    doc = Document()
    
    # Set Arial font as default
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    
    # Clear default paragraph
    for paragraph in doc.paragraphs:
        p = paragraph._element
        p.getparent().remove(p)
    
    # Add header section
    # Logo (if available)
    if logo_path and os.path.exists(logo_path):
        try:
            header_para = doc.add_paragraph()
            header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = header_para.runs[0] if header_para.runs else header_para.add_run()
            run.add_picture(logo_path, height=Inches(1.67))  # 120px ≈ 1.67 inches
        except Exception:
            pass  # Skip logo if there's an issue
    
    # Title (H1 style: 12pt, bold, uppercase, underlined)
    if meta.get('title_text'):
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(meta['title_text'].upper())
        title_run.font.name = 'Arial'
        title_run.font.size = Pt(12)
        title_run.font.bold = True
        title_run.font.underline = True
        title_para.space_after = Pt(8)
    
    # Reference
    if meta.get('rujukan'):
        ref_para = doc.add_paragraph()
        ref_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        ref_run = ref_para.add_run(f"Rujukan: {meta['rujukan']}")
        ref_run.font.name = 'Arial'
        ref_run.font.size = Pt(11)
        ref_run.font.bold = True
        ref_para.space_after = Pt(12)
    
    # Metadata table
    meta_fields = [
        ('Bil. Mesyuarat', meta.get('bil')),
        ('Tarikh', meta.get('tarikh')),
        ('Masa', meta.get('masa')),
        ('Tempat', meta.get('tempat'))
    ]
    
    # Only add metadata if we have any values
    meta_to_add = [(k, v) for k, v in meta_fields if v]
    if meta_to_add:
        meta_table = doc.add_table(rows=len(meta_to_add), cols=2)
        meta_table.allow_autofit = True
        
        for i, (label, value) in enumerate(meta_to_add):
            row = meta_table.rows[i]
            
            # Label cell
            label_cell = row.cells[0]
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.font.name = 'Arial'
            label_run.font.size = Pt(11)
            label_run.font.bold = True
            label_cell.width = Inches(1.8)
            
            # Value cell
            value_cell = row.cells[1]
            value_para = value_cell.paragraphs[0]
            value_run = value_para.add_run(f": {value}")
            value_run.font.name = 'Arial'
            value_run.font.size = Pt(11)
        
        # Add space after metadata table
        meta_para = doc.add_paragraph()
        meta_para.space_after = Pt(12)
    
    # Parse and add body content - simplified approach for standard markdown
    soup = BeautifulSoup(body_html, 'html.parser')
    
    def process_element_text(element):
        """Process text content from HTML element with proper formatting"""
        para = doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        for child in element.children:
            if hasattr(child, 'name'):
                if child.name in ['strong', 'b']:
                    run = para.add_run(child.get_text())
                    run.font.bold = True
                    run.font.name = 'Arial'
                    run.font.size = Pt(11)
                elif child.name in ['em', 'i']:
                    run = para.add_run(child.get_text())
                    run.font.italic = True
                    run.font.name = 'Arial'
                    run.font.size = Pt(11)
                else:
                    run = para.add_run(child.get_text())
                    run.font.name = 'Arial'
                    run.font.size = Pt(11)
            else:
                text_content = str(child).strip()
                if text_content:
                    run = para.add_run(text_content)
                    run.font.name = 'Arial'
                    run.font.size = Pt(11)
    
    # Process only basic HTML elements to avoid parsing issues
    for element in soup.find_all(['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'table']):
        
        if element.name in ['h1', 'h2', 'h3']:
            # Section headings
            level = int(element.name[1])
            heading = doc.add_heading(element.get_text().strip(), level=min(level, 3))
            heading.runs[0].font.name = 'Arial'
            if level == 1:
                heading.runs[0].font.size = Pt(12)
                heading.runs[0].font.bold = True
                heading.runs[0].font.underline = True
            elif level == 2:
                heading.runs[0].font.size = Pt(12)
                heading.runs[0].font.bold = True
            else:
                heading.runs[0].font.size = Pt(11)
                heading.runs[0].font.bold = True
                
        elif element.name == 'p':
            # Regular paragraphs
            process_element_text(element)
                    
        elif element.name in ['ul', 'ol']:
            # Lists
            for li in element.find_all('li', recursive=False):
                para = doc.add_paragraph(li.get_text().strip(), style='List Bullet' if element.name == 'ul' else 'List Number')
                para.runs[0].font.name = 'Arial'
                para.runs[0].font.size = Pt(11)
                
        elif element.name == 'table':
            # Tables
            rows = element.find_all('tr')
            if rows:
                table = doc.add_table(rows=len(rows), cols=len(rows[0].find_all(['th', 'td'])))
                table.style = 'Table Grid'
                
                for i, row in enumerate(rows):
                    cells = row.find_all(['th', 'td'])
                    for j, cell in enumerate(cells):
                        table_cell = table.cell(i, j)
                        
                        # Clear default paragraphs
                        for p in table_cell.paragraphs[1:]:
                            p._element.getparent().remove(p._element)
                        
                        cell_para = table_cell.paragraphs[0]
                        cell_run = cell_para.add_run(cell.get_text().strip())
                        cell_run.font.name = 'Arial'
                        cell_run.font.size = Pt(11)
                        
                        if cell.name == 'th':
                            cell_run.font.bold = True
    
    # Generate unique filename
    filename = f"pdrm_minutes_{uuid.uuid4().hex[:8]}.docx"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving PDRM DOCX to: {file_path.absolute()}")
    
    # Save the document
    doc.save(str(file_path))
    
    logger.info(f"PDRM DOCX file exists after save: {file_path.exists()}")
    
    return file_path

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    max_workers: Optional[int] = Form(default=None),
    output_path: Optional[str] = Form(default=None),
    model_name: Optional[str] = Form(default="Whisper"),
    language: Optional[str] = Form(default="en")
):
    """
    Endpoint to transcribe an uploaded audio file.
    
    Args:
        file: The audio file to transcribe (supported formats: mp3, wav, m4a, mp4, etc.)
        background_tasks: FastAPI background tasks for cleanup
        output_path: Optional path where the transcription should be saved
        max_workers: Number of worker threads to use for concurrent processing
    
    Returns:
        JSON response with the transcription result or error details
    """
    logger.info(f"=== MAX_WORKERS DEBUGGING ===")
    logger.info(f"Parsed max_workers from request: {max_workers}")
    logger.info(f"Type of max_workers: {type(max_workers)}")
    logger.info(f"File received: {file.filename}, Content-Type: {file.content_type}")
    logger.info(f"=============================")
    # Validate file type
    allowed_types = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/mp4', 'audio/mp4']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported types: {', '.join(allowed_types)}"
        )
    
    # Generate unique identifiers for this request
    request_id = str(uuid.uuid4())
    temp_upload_path = UPLOAD_DIR / f"{request_id}_{file.filename}"
    temp_output_path = TRANSCRIPTION_DIR / f"{request_id}_{file.filename}_transcription.txt"
    
    # Initialize progress tracking
    progress_store[request_id] = {
        "status": "initializing",
        "message": "Starting transcription...",
        "percentage": 0,
        "completed": False
    }
    
    try:
        # Update progress - file upload
        progress_store[request_id].update({
            "status": "uploading",
            "message": "Saving uploaded file...",
            "percentage": 10
        })
        
        # Save uploaded file
        with open(temp_upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved: {temp_upload_path}")
        
        # Update progress - starting transcription
        progress_store[request_id].update({
            "status": "processing",
            "message": "Processing audio file...",
            "percentage": 20
        })
        
        # Use provided output_path or default to generated path
        final_output_path = Path(output_path) if output_path else temp_output_path
        
        # Update progress - transcribing
        progress_store[request_id].update({
            "status": "transcribing",
            "message": "Transcribing audio segments...",
            "percentage": 30
        })
        
        # Start background task to monitor progress
        import threading
        import time
        
        def monitor_progress():
            start_time = time.time()
            # Estimate total time based on file size (rough estimate)
            file_size_mb = temp_upload_path.stat().st_size / (1024 * 1024)
            estimated_duration = max(30, min(300, file_size_mb * 5))  # 5 seconds per MB, min 30s, max 300s
            
            while request_id in progress_store and not progress_store[request_id].get('completed', False):
                elapsed = time.time() - start_time
                if elapsed >= estimated_duration:
                    break
                    
                # Calculate progress (30% to 95% during transcription)
                progress_pct = 30 + (elapsed / estimated_duration) * 65
                progress_pct = min(95, progress_pct)
                
                progress_store[request_id].update({
                    "status": "transcribing",
                    "message": f"Transcribing audio segments... ({elapsed:.0f}s elapsed)",
                    "percentage": progress_pct
                })
                time.sleep(2)  # Update every 2 seconds
                
        # Start monitoring thread
        monitor_thread = threading.Thread(target=monitor_progress)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Transcribe the audio file
        transcription = transcriber.transcribe_file(
            audio_path=str(temp_upload_path),
            output_path=str(final_output_path),
            max_workers=max_workers,
            model_name=model_name,
            language=language
        )
        
        # Final progress update
        progress_store[request_id].update({
            "status": "completed",
            "message": "Transcription completed successfully!",
            "percentage": 100,
            "completed": True
        })
        
        # Return the transcription result
        return JSONResponse({
            "request_id": request_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "transcription": transcription,
            "output_path": str(final_output_path)
        })
        
    except FileNotFoundError as e:
        logger.error(f"File not found error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"File not found: {str(e)}")
        
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        # Update progress with error
        if request_id and request_id in progress_store:
            progress_store[request_id].update({
                "status": "error",
                "message": f"Transcription failed: {str(e)}",
                "percentage": 0,
                "completed": True,
                "error": True
            })
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
    finally:
        # Add cleanup task to remove uploaded file
        if background_tasks:
            #background_tasks.add_task(remove_file, temp_upload_path)
            # Also clean up the transcription file if it was saved in our directory
            #if str(final_output_path).startswith(str(TRANSCRIPTION_DIR)):
            #    background_tasks.add_task(remove_file, final_output_path)
            pass
         
def remove_file(file_path: Path):
    """
    Helper function to remove a file.
    """
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.error(f"Failed to clean up file {file_path}: {str(e)}")

@app.post("/completion")
async def completion_api(messages: list = Body(...)):
    """
    API endpoint to handle chat completion requests with progress tracking.
    
    Args:
        messages: List of message objects with role and content
        
    Returns:
        JSON response with the completion text and request_id for progress tracking
    """
    # Generate request ID for progress tracking
    request_id = str(uuid.uuid4())
    
    # Initialize progress tracking
    progress_store[request_id] = {
        "status": "initializing",
        "message": "Preparing AI request...",
        "percentage": 0,
        "completed": False
    }
    
    try:
        # Update progress - start processing
        progress_store[request_id].update({
            "status": "processing",
            "message": "Sending request to AI model...",
            "percentage": 20
        })
        
        # Log the request to LLM model
        logger.info(f"Sending completion request to LLM model with {len(messages)} messages")
        
        # Update progress - waiting for response
        progress_store[request_id].update({
            "status": "waiting",
            "message": "Waiting for AI response...",
            "percentage": 40
        })
        
        # Add system prompt for PDRM meeting minutes conversion
        system_prompt = {
            "role": "system",
            "content": """Convert the meeting transcript into a clean PDRM meeting minutes document in Bahasa Malaysia.

Start with header information (COMPULSARY):
[Produce detailed meeting title from context]
Rujukan: [Generate reference like PDRM/MM/2025/001]
Bil. Mesyuarat: [Infer number like 1/2025]
Tarikh: [Extract or infer date]
Masa: [Extract meeting duration]
Tempat: [Extract location]

Then provide content sections:

## KEHADIRAN
[Name/Title] (Pengerusi) [Hadir]
[Name/Title] [Hadir/Tidak Hadir]

Then these are all the agenda for the meeting, from start to end.
## [EXTRACT TOPIC]

For each agenda ONLY, NOT EACH ITEMS AND SUBPOINTS, classify correctly:
- **[Makluman]** - ONLY for pure information with no action required
- **[Specific Person/Department]** - For ALL action items, identify WHO is responsible. No need to put the word "Tindakan:"
- **[Perbincangan]** - For ongoing discussions needing follow-up

Example:
18. Sokongan Rekabentuk & Dokumentasi
1. RFI sedia:
1.1. Berkongsi panduan pemilihan antena
1.2. Kertas teknikal (technical paper)
1.3. Bantuan rekabentuk sistem baru
2. Sokongan berterusan untuk pasukan kejuruteraan PDRM.

**[RFI / Hock Goh]**

CRITICAL: For action items like training, follow-ups, implementations - ALWAYS specify the responsible party, never use [Makluman].

Examples:
✅ Attend refresher course [Pegawai Ahmad]
✅ Submit report by Friday [MCSB]
✅ Schedule follow-up meeting [Ketua Unit]
❌ Training required [Makluman] ← WRONG

List all items in detail. Use 1 2 3 for number
Use sub-numbering (1.1.1, 1.1.2) for subitems.

At the end of it:
## PENUTUP
1. Mesyuarat ditangguhkan pada [time]
2. Disediakan oleh: [name]
3. Disemak oleh: [name]

Output the structured content in detail with explanatory for each subunits."""
        }
        
        # Prepare messages with system prompt
        formatted_messages = [system_prompt] + messages

        # Send request to LLM model
        llm_response = requests.post(
            LLM_ADDRESS,
            json={
                "model": LLM_MODEL,
                "messages": formatted_messages
            }
        )
        
        # Update progress - processing response
        progress_store[request_id].update({
            "status": "processing_response",
            "message": "Processing AI response...",
            "percentage": 80
        })
        
        # Log the response status
        logger.info(f"LLM response status: {llm_response.status_code}")
        logger.info(f"LLM response text: {llm_response.text[:500]}...")  # Log first 500 chars
        
        llm_response.raise_for_status()
        llm_data = llm_response.json()
        
        # Extract response text from chat completions response
        response_text = llm_data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        # Final progress update
        progress_store[request_id].update({
            "status": "completed",
            "message": "AI processing completed!",
            "percentage": 100,
            "completed": True
        })
        
        return JSONResponse({
            "request_id": request_id,
            "text": response_text
        })
        
    except Exception as e:
        # Update progress with error
        progress_store[request_id].update({
            "status": "error",
            "message": f"AI processing failed: {str(e)}",
            "percentage": 0,
            "completed": True,
            "error": True
        })
        raise HTTPException(status_code=500, detail=f"Completion failed: {str(e)}")

# New PDRM Minutes functionality
# Enhanced regex patterns for better action item detection
TINDAKAN_RE = re.compile(r'\bTindakan\s*:\s*([^.|;<>\n]+)', re.IGNORECASE)
ACTION_KEYWORDS_RE = re.compile(r'\b(?:perlu|harus|wajib|akan|hendak|mesti|kena|patut)\s+([^.|;<>\n]*(?:oleh|kepada|daripada)\s+([^.|;<>\n]+))', re.IGNORECASE)
RESPONSIBLE_PARTY_RE = re.compile(r'\b(?:oleh|kepada|daripada)\s+([^.|;<>\n,]+)', re.IGNORECASE)

def extract_metadata_from_content(md_text: str) -> dict:
    """Extract meeting metadata from AI-generated content."""
    lines = md_text.split('\n')
    metadata = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Extract title - look for lines starting with # or **
        if line.startswith('#') and ('minit' in line.lower() or 'mesyuarat' in line.lower()):
            # Remove # markers and get the title
            title = line.lstrip('#').strip()
            metadata['title_text'] = title
        elif line.startswith('**') and line.endswith('**') and ('minit' in line.lower() or 'mesyuarat' in line.lower()):
            # Remove ** markers and get the title
            title = line.strip('*').strip()
            metadata['title_text'] = title
        elif line.startswith('MINIT MESYUARAT'):
            # Direct title line
            metadata['title_text'] = line
        
        # Extract metadata fields
        if line.lower().startswith('rujukan:'):
            metadata['rujukan'] = line.split(':', 1)[1].strip()
        elif line.lower().startswith('bil. mesyuarat:') or line.lower().startswith('bil mesyuarat:'):
            metadata['bil'] = line.split(':', 1)[1].strip()
        elif line.lower().startswith('tarikh:'):
            metadata['tarikh'] = line.split(':', 1)[1].strip()
        elif line.lower().startswith('masa:'):
            metadata['masa'] = line.split(':', 1)[1].strip()
        elif line.lower().startswith('tempat:'):
            metadata['tempat'] = line.split(':', 1)[1].strip()
    
    # Don't set default title - let AI generate it completely
    return metadata

def remove_title_from_content(md_text: str) -> str:
    """Remove title lines from markdown content to prevent duplication in PDRM template."""
    lines = md_text.split('\n')
    filtered_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        
        # Skip title lines - look for lines starting with # or ** that contain meeting-related words
        if line_stripped.startswith('#') and ('minit' in line_stripped.lower() or 'mesyuarat' in line_stripped.lower()):
            continue
        elif line_stripped.startswith('**') and line_stripped.endswith('**') and ('minit' in line_stripped.lower() or 'mesyuarat' in line_stripped.lower()):
            continue
        elif line_stripped.startswith('MINIT MESYUARAT'):
            continue
        else:
            filtered_lines.append(line)
    
    return '\n'.join(filtered_lines)

def strip_sections(md_text: str) -> str:
    """Remove unwanted sections, metadata, and preamble from markdown text, keeping only the content."""
    lines = md_text.split('\n')
    filtered_lines = []
    skip_section = False
    in_preamble = True
    
    for line in lines:
        line_stripped = line.strip()
        
        # Skip completely empty lines in preamble
        if in_preamble and not line_stripped:
            continue
            
        # Skip preamble content (introductory text before actual content)
        if in_preamble and (
            line_stripped.startswith('MINIT MESYUARAT') or
            line_stripped.lower().startswith('rujukan:') or
            line_stripped.lower().startswith('bil.') or
            line_stripped.lower().startswith('tarikh:') or
            line_stripped.lower().startswith('masa:') or
            line_stripped.lower().startswith('tempat:') or
            line_stripped == '---' or
            'berikut adalah' in line_stripped.lower() or
            'structured and cleaned' in line_stripped.lower() or
            'here is a' in line_stripped.lower() or
            'telah dianalisis' in line_stripped.lower() or
            'format minit mesyuarat' in line_stripped.lower() or
            'official meeting minutes' in line_stripped.lower() or
            'markdown' in line_stripped.lower() or
            line_stripped.startswith('**') and any(word in line_stripped.lower() for word in ['rujukan', 'tarikh', 'masa', 'tempat', 'berikut', 'structured']) or
            'preserve' in line_stripped.lower() or
            'timestamp' in line_stripped.lower()
        ):
            continue
        
        # End of preamble when we hit first proper heading (# KEHADIRAN, # AGENDA, etc.)
        if line_stripped.startswith('#'):
            in_preamble = False
        
        # Check if this line starts a section we want to skip (signatures, etc.)
        line_lower = line_stripped.lower()
        if any(keyword in line_lower for keyword in ['disediakan', 'disemak', 'disahkan']):
            if line_stripped.startswith('#') or line_stripped.startswith('**'):
                skip_section = True
                continue
        
        # Reset skip if we hit a new section
        if line_stripped.startswith('#') and skip_section:
            skip_section = False
        
        if not skip_section and not in_preamble:
            filtered_lines.append(line)
    
    return '\n'.join(filtered_lines)

def _li_depth(li):
    """Calculate the depth of a list item."""
    depth = 0
    p = li.parent
    while p and p.name in ("ul", "ol"):
        depth += 1
        p = p.parent
    # depth includes li's own list, so top-level becomes 1
    return max(0, depth - 1)

def _extract_number(li, idx):
    """Return numbering like '1.' for top-level ordered lists, else bullet index."""
    # If parent is <ol>, try to use its numbering; otherwise show '•'
    if li.parent and li.parent.name == 'ol':
        start = li.parent.get('start')
        try:
            base = int(start) if start else 1
        except:
            base = 1
        return f"{base + idx}."
    return "•"

def minutes_markdown_to_wrapped_html(md_text: str) -> str:
    """Convert markdown to HTML with PDRM item formatting."""
    raw_html = md_to_html(md_text, extensions=['tables'])
    soup = BeautifulSoup(raw_html, "html.parser")

    # Style markdown tables
    for tbl in soup.find_all("table"):
        tbl['class'] = (tbl.get('class', []) + ['md'])

    out = []

    def emit_header(tag):
        # Keep original heading tags; CSS handles sizes (H1/H2/H3)
        out.append(f'<div class="section">{str(tag)}</div>')

    def emit_item(no, text_html, tag, depth):
        depth_cls = f" sub{depth}" if depth > 0 else ""
        out.append(
            f'<div class="item{depth_cls}">'
            f'<div class="no">{no}</div>'
            f'<div class="text">{text_html}</div>'
            f'<div class="tag">{tag}</div>'
            f'</div>'
        )

    # Walk through top-level nodes and convert lists into .item rows
    for node in list(soup.children):
        if not getattr(node, 'name', None):
            # strings outside blocks
            continue

        if node.name in ('h1','h2','h3','h4','h5','h6','p','table','blockquote'):
            emit_header(node) if node.name.startswith('h') else out.append(str(node))
            continue

        if node.name in ('ul','ol'):
            # expand all li (including nested)
            def walk_list(lst):
                lis = lst.find_all('li', recursive=False)
                for idx, li in enumerate(lis):
                    # Get full text content
                    li_html = ''.join(str(c) for c in li.contents)
                    li_text = li.get_text()
                    
                    # Extract explicit tindakan
                    m = TINDAKAN_RE.search(li_html)
                    if m:
                        tag = m.group(1).strip()
                        li_html = TINDAKAN_RE.sub('', li_html, count=1).strip()
                        final_tag = f"Tindakan: {tag}"
                    else:
                        # Intelligent action detection
                        tag = detect_action_item(li_text)
                        final_tag = f"Tindakan: {tag}" if tag != "Makluman" else "Makluman"

                    # depth and number
                    depth = _li_depth(li)
                    no = _extract_number(li, idx)

                    # split out any nested lists for separate processing
                    sublists = li.find_all(['ul','ol'], recursive=False)
                    for s in sublists:
                        s.extract()

                    # remaining text for this li
                    text_html = li_html

                    emit_item(no, text_html, final_tag, depth)

                    # now render sublists
                    for s in sublists:
                        walk_list(s)

            walk_list(node)
            continue

        # default passthrough (rare)
        out.append(str(node))

    body = '\n'.join(out)
    return body

def detect_action_item(text: str) -> str:
    """Detect if text contains action items and extract responsible party."""
    text_lower = text.lower()
    
    # Past tense or completed actions - usually just informational
    completed_indicators = [
        'telah', 'sudah', 'selesai', 'berjaya', 'completed', 'done', 'finished',
        'disolder', 'dikemas kini', 'diubah', 'dilakukan', 'dijalankan', 'di-restart',
        'berfungsi', 'semula', 'normal', 'rosak', 'diperbaiki'
    ]
    
    # Check if it's describing something that already happened (informational)
    if any(indicator in text_lower for indicator in completed_indicators):
        return "Makluman"
    
    # Clear informational phrases
    info_phrases = [
        'memberitahu', 'melaporkan', 'menjelaskan', 'dimaklumkan',
        'dijelaskan', 'dipersembahkan', 'dinyatakan', 'memaklumkan',
        'hasil', 'keputusan', 'ujian', 'testing', 'paparan'
    ]
    
    if any(phrase in text_lower for phrase in info_phrases):
        return "Makluman"
    
    # Look for explicit responsible parties - people's names
    # Common Malaysian names (extract actual names, not technical terms)
    name_patterns = [
        r'\b(hafiz|ahmad|ali|siti|nur|mohammed|muhammad|abdul|syafiq|afin|encik|puan)\b',
        r'\b(?:encik|puan|dato|datuk|dr\.?)\s+([a-z]+)\b'
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if len(match.groups()) > 1:
                return "Encik " + match.group(2).title()
            else:
                return match.group(1).title()
    
    # Look for organizational responsibility
    org_patterns = [
        r'\bpihak\s+(syarikat|vendor|contractor|pembekal)\b',
        r'\b(syarikat|vendor|contractor|pembekal)\s+([a-z\s]+)\b'
    ]
    
    for pattern in org_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if len(match.groups()) > 1:
                return "Pihak " + match.group(2).title()
            else:
                return "Pihak " + match.group(1).title()
    
    # Look for departments
    departments = ['pdrm', 'mcsb', 'jabatan', 'bahagian', 'unit']
    for dept in departments:
        if dept in text_lower:
            return dept.upper()
    
    # Future actions requiring responsibility
    future_action_indicators = [
        'perlu', 'harus', 'wajib', 'akan', 'hendak', 'mesti', 'kena', 'patut',
        'schedule', 'prepare', 'submit', 'attend', 'follow up', 'implement'
    ]
    
    # Only assign responsibility for future actions, not completed ones
    if any(indicator in text_lower for indicator in future_action_indicators):
        # Try to find context about who should do it
        if 'syarikat' in text_lower or 'vendor' in text_lower:
            return "Pihak Syarikat"
        elif 'teknisi' in text_lower or 'jurutera' in text_lower:
            return "Pihak Teknikal"
        else:
            return "Pihak Berkenaan"
    
    # Default to informational for everything else
    return "Makluman"

def render_pdrm_minutes_html(body_html: str, meta: dict, logo_src: str = "") -> str:
    """Render PDRM minutes using the template."""
    template = templates.get_template("pdrm_minutes.html")
    
    context = {
        "body_html": body_html,
        "logo_src": logo_src,
        **meta
    }
    
    return template.render(**context)

def generate_pdrm_pdf(html_content: str) -> Path:
    """Generate a PDF from PDRM HTML content."""
    # Generate unique filename
    filename = f"pdrm_minutes_{uuid.uuid4().hex[:8]}.pdf"
    file_path = DOWNLOAD_DIR / filename
    
    logger.info(f"Saving PDRM PDF to: {file_path.absolute()}")
    
    # Set base URL to current working directory for relative paths
    base_url = Path.cwd().as_uri() + "/"
    
    # Convert HTML to PDF with base URL
    HTML(string=html_content, base_url=base_url).write_pdf(str(file_path))
    
    logger.info(f"PDRM PDF file exists after save: {file_path.exists()}")
    
    return file_path

@app.post("/minutes/render")
async def render_minutes_endpoint(
    text: str = Form(...),
    # Metadata will be extracted automatically from AI content
    footer_text: str = Form(""),
    logo_path: str = Form("static/asset/logo.png"),
    output_format: str = Query("pdf", regex="^(pdf|html|docx)$")
):
    try:
        # Extract metadata from AI-generated content
        extracted_meta = extract_metadata_from_content(text)
        
        # Remove title from content to prevent duplication
        content_without_title = remove_title_from_content(text)
        
        # Use simple markdown conversion instead of custom processing
        body_html = markdown.markdown(content_without_title, extensions=['tables'])

        # Use extracted metadata - no defaults for title
        meta = {
            "title_text": extracted_meta.get('title_text', ''),  # Let AI provide the complete title
            "rujukan": extracted_meta.get('rujukan', ''),
            "bil": extracted_meta.get('bil', ''),
            "tarikh": extracted_meta.get('tarikh', ''),
            "masa": extracted_meta.get('masa', ''),
            "tempat": extracted_meta.get('tempat', ''),
            "footer_text": footer_text
        }
        
        html = render_pdrm_minutes_html(body_html, meta, logo_src=logo_path)

        if output_format == "html":
            fname = DOWNLOAD_DIR / f"minutes_{uuid.uuid4().hex[:8]}.html"
            fname.write_text(html, encoding="utf-8")
            return JSONResponse({"html_url": f"/downloads/{fname.name}"})

        if output_format == "pdf":
            pdf_path = generate_pdrm_pdf(html)
            return JSONResponse({"pdf_url": f"/downloads/{pdf_path.name}"})

        if output_format == "docx":
            # Use original markdown text directly to avoid HTML parsing issues
            docx_path = generate_pdrm_docx_from_markdown(content_without_title, meta, logo_path)
            return JSONResponse({"docx_url": f"/downloads/{docx_path.name}"})

    except Exception as e:
        logger.exception("Minutes render failed")
        raise HTTPException(status_code=500, detail=f"Minutes render failed: {str(e)}")

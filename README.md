# Audio Transcription and Meeting Minutes Service

A FastAPI-based service that transcribes audio files and processes text into structured meeting minutes with document generation capabilities.

## Features

- REST API endpoints for audio transcription
- Support for multiple audio formats (mp3, wav, m4a, mp4, etc.)
- Concurrent processing of audio segments for improved performance
- Automatic cleanup of temporary files
- Comprehensive error handling and logging
- Health check endpoint
- Web interface for audio transcription
- Text processing with LLM to generate structured meeting minutes
- Document generation in PDF and DOCX formats
- Downloadable output files

## API Endpoints

### `GET /`

Root endpoint serving the HTML interface for the transcription service.

### `GET /api/info`

API information endpoint returning JSON data about the service.

**Response:**
```json
{
  "message": "Audio Transcription Service",
  "version": "1.0.0",
  "endpoints": {
    "POST /transcribe": "Transcribe an uploaded audio file",
    "GET /health": "Check the health status of the service"
  }
}
```

### `GET /health`

Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "healthy"
}
```

### `POST /transcribe`

Transcribe an uploaded audio file.

**Request Parameters:**
- `file` (UploadFile): The audio file to transcribe (required)
- `output_path` (string, optional): Path where the transcription should be saved
- `max_workers` (integer, optional): Number of worker threads to use for concurrent processing (default: 6)

**Request Example (using curl):**
```bash
curl -X POST "http://localhost:8000/transcribe" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/audio.mp3" \
     -F "max_workers=4"
```

**Successful Response:**
```json
{
  "request_id": "string",
  "filename": "string",
  "content_type": "string",
  "transcription": "string",
  "output_path": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Unsupported file type or file not found
- `500 Internal Server Error`: Transcription failed

### `POST /process_text`

Process text input and return structured meeting minutes with document generation.

**Request Parameters:**
- `text` (string): The text to process (required)
- `output_format` (string): Desired output file format (pdf or docx, default: pdf)

**Request Example (using curl):**
```bash
curl -X POST "http://localhost:8000/process_text?output_format=pdf" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"text": "Meeting transcript text here"}'
```

**Successful Response:**
```json
{
  "markdown": "string",
  "download_url": "/downloads/document_xxxxxxxx.pdf",
  "content_type": "application/pdf",
  "filename": "document_xxxxxxxx.pdf"
}
```

**Error Responses:**
- `500 Internal Server Error`: Processing failed

### `GET /downloads/{filename}`

Serve generated documents for download.

## Web Interface

The service provides a web interface at the root URL (`/`) for uploading and transcribing audio files. The interface is served from `static/index.html` and includes JavaScript functionality for file uploads and transcription processing.

Key features of the web interface:
- Audio file upload with drag-and-drop support
- Transcription display in an editable textarea
- Automatic saving of transcription edits to browser localStorage
- Persistence of edited transcriptions between browser sessions
- Copy to clipboard functionality
- Document generation in PDF and DOCX formats

## Document Generation

The service can generate documents in PDF and DOCX formats from processed text:
- PDF generation uses WeasyPrint with HTML conversion
- DOCX generation uses python-docx with basic formatting
- Generated files are stored in the `downloads/` directory
- Files can be downloaded via the `/downloads/{filename}` endpoint

## Setup and Installation

1. Clone this repository

cd ~/minute_meeting

uv venv --python 3.12 .venv

source ~/minute_meeting/.venv/bin/activate

python -m ensurepip --upgrade

python -m pip install --upgrade pip


2. Install the required dependencies:
```bash
pip install -r requirements.txt
```
3. Ensure you have the `transcribe_audio.py` file in the same directory
4. Start the service:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 3318
```

## Systemd Service Configuration

The application can be deployed as a systemd service for automatic startup and management.

### Service File

The service file `minute_meeting.service` should be placed in `/etc/systemd/system/`:

```ini
[Unit]
Description=Minute Meeting Transcription Service
After=network.target

[Service]
Type=simple
User=user1
WorkingDirectory=/home/user1/minute_meeting
ExecStart=/home/user1/minute_meeting/.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 3318
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Service Management Commands

```bash
# Copy the service file to systemd directory
sudo cp minute_meeting.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Start the service
sudo systemctl start minute_meeting.service

# Enable the service to start on boot
sudo systemctl enable minute_meeting.service

# Check service status
sudo systemctl status minute_meeting.service
```

## Usage

Once the service is running, you can access the API at `http://localhost:3318`.

The API documentation is also available at `http://localhost:3318/docs` (Swagger UI) and `http://localhost:3318/redoc` (ReDoc).

## Monitoring and Logs

### Checking Service Status

```bash
# Check if the service is active
sudo systemctl is-active minute_meeting.service

# Get detailed status information
sudo systemctl status minute_meeting.service
```

### Viewing Logs with Journalctl

```bash
# View all logs for the service
sudo journalctl -u minute_meeting.service

# View logs from the current boot only
sudo journalctl -u minute_meeting.service -b

# Follow logs in real-time (similar to tail -f)
sudo journalctl -u minute_meeting.service -f

# View logs from the last hour
sudo journalctl -u minute_meeting.service --since "1 hour ago"

# View logs with timestamps
sudo journalctl -u minute_meeting.service -u --since "2025-09-05 00:00:00"

# Show only error logs
sudo journalctl -u minute_meeting.service -p err

# Show logs with line numbers
sudo journalctl -u minute_meeting.service --lines=all --no-pager
```

## Configuration

The service uses the following directories:
- `uploads/`: Temporary storage for uploaded audio files
- `transcriptions/`: Storage for transcription output files
- `downloads/`: Storage for generated PDF and DOCX documents
- `static/`: Static files for the web interface

These directories are created automatically when the service starts.

## Transcription Workflow

The audio transcription process follows these steps:

1. **Audio Conversion**: Input audio files are converted to WAV format using pydub
2. **Segmentation**: Long audio files are split into 30-second segments with 500ms overlap
3. **Concurrent Processing**: Segments are transcribed concurrently using ThreadPoolExecutor
4. **Aggregation**: Transcribed text from all segments is combined
5. **Post-processing**: Repeated phrases are removed using NLTK tokenization
6. **Cleanup**: Temporary audio segments are automatically removed

## Text Processing Workflow

The text processing for meeting minutes follows these steps:

1. **LLM Processing**: Text is sent to the LLM model at `http://60.51.17.97:9501/v1/chat/completions`
2. **Structured Formatting**: The LLM converts raw text into structured Markdown with headings, lists, and tables
3. **Document Generation**: Markdown is converted to the requested format (PDF or DOCX)
4. **File Storage**: Generated documents are saved in the downloads directory
5. **Response**: Returns Markdown content and download URL for the generated document

## Dependencies

- Python 3.7+
- FastAPI
- Uvicorn
- pydub
- OpenAI Python library
- NLTK
- requests
- WeasyPrint (for PDF generation)
- python-docx (for DOCX generation)
- beautifulsoup4 (for HTML parsing in DOCX generation)

## License

[Specify your license here]
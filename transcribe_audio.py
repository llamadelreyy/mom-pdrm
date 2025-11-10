import asyncio
import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple

from pydub import AudioSegment
from openai import OpenAI, AsyncOpenAI
import nltk
from nltk.tokenize import word_tokenize
from nltk.util import ngrams

import uuid
import shutil

# Configuration variables
API_BASE = "http://60.51.17.97:9801/v1"
API_BASE_MALAYSIA = "http://60.51.17.97:7801/v1"
TRANSCRIPTION_MODEL = "stt_model"
TRANSCRIPTION_MODEL_MALAYSIA = "stt_model"

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')


class AudioTranscriber:
    """
    A class to handle transcription of long audio files by segmenting them into
    smaller chunks that can be processed by the STT model.
    """
    
    def __init__(self, api_key: str = "EMPTY", api_base: str = API_BASE, segment_length: int = 30000, overlap: int = 300):
        """
        Initialize the transcriber with API configuration.
        
        Args:
            api_key: API key for authentication
            api_base: Base URL for the API
            segment_length: Length of each audio segment in milliseconds (default: 30 seconds)
            overlap: Overlap between segments in milliseconds (default: 500ms)
        """
        self.client = OpenAI(api_key=api_key, base_url=api_base)
        self.async_client = AsyncOpenAI(api_key=api_key, base_url=api_base)
        # Segment length in milliseconds (30 seconds)
        self.segment_length = segment_length
        # Overlap between segments in milliseconds (500ms = 0.5 seconds)
        self.overlap = overlap
    
    def convert_to_wav(self, input_path: str) -> tuple:
        """
        Convert any audio/video file to WAV format.
        Returns a tuple containing (path to converted file, path to temp directory).
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
            
        # Load the audio file (pydub can handle various formats including MP4)
        audio = AudioSegment.from_file(input_path)
        
        # Create output path for WAV file in temp directory

        # Create a unique temp directory using UUID to avoid conflicts in concurrent sessions
        unique_id = uuid.uuid4().hex[:8]
        temp_dir = Path(__file__).parent / "temp" / unique_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        output_path = temp_dir / f"{Path(input_path).stem}_converted.wav"
        
        # Export as WAV
        audio.export(output_path, format="wav")
        print(f"Converted {input_path} to {output_path}")
        
        return output_path, temp_dir
    
    def split_audio(self, audio_path: str) -> List[str]:
        """
        Split audio file into segments of specified length with overlap between segments.
        Returns a list of paths to the segment files.
        
        The first segment starts at 0ms, and subsequent segments are created with
        an overlap of self.overlap milliseconds to ensure continuity in transcription.
        """
        # Initialize temp_dir_created variable
        temp_dir_created = None
        
        # Convert to WAV if needed and create temp directory for segments
        if not audio_path.lower().endswith('.wav'):
            audio_path, temp_dir_created = self.convert_to_wav(audio_path)
        else:
            # For already WAV files, we'll create a temp directory to store segments
            unique_id = uuid.uuid4().hex[:8]
            temp_dir_created = Path(__file__).parent / "temp" / unique_id
            temp_dir_created.mkdir(parents=True, exist_ok=True)
            # Update audio_path to be within the temp directory for consistency
            new_audio_path = temp_dir_created / Path(audio_path).name
            shutil.copy2(audio_path, new_audio_path)
            audio_path = str(new_audio_path)
            
        # Ensure temp_dir_created is set for cleanup
        if temp_dir_created is None:
            # This should not happen, but just in case
            unique_id = uuid.uuid4().hex[:8]
            temp_dir_created = Path(__file__).parent / "temp" / unique_id
            temp_dir_created.mkdir(parents=True, exist_ok=True)
        
        audio = AudioSegment.from_wav(audio_path)
        duration_ms = len(audio)
        
        segment_files = []
        # Step size is segment length minus overlap
        step_size = self.segment_length - self.overlap
        
        for i, start_ms in enumerate(range(0, duration_ms, step_size)):
            end_ms = min(start_ms + self.segment_length, duration_ms)
            segment = audio[start_ms:end_ms]
            
            # Only create segment if it has some audio (handles edge case near end)
            if len(segment) > 0:
                # Use the same unique temp directory as created during conversion
                # Get the parent temp directory from the audio_path
                temp_dir = Path(audio_path).parent
                segment_filename = temp_dir / f"segment_{i:03d}.wav"
                segment.export(segment_filename, format="wav")
                segment_files.append(str(segment_filename))
                # Convert ms to seconds for display
                start_sec = start_ms // 1000
                end_sec = end_ms // 1000
                print(f"Created segment: {segment_filename} ({start_sec}-{end_sec}s)")
            
            # Break if this segment reaches the end of the audio
            if end_ms >= duration_ms:
                break
        
        return segment_files, temp_dir_created
    
    def transcribe_segment(self, segment_path: str, api_base: str = API_BASE, model: str = TRANSCRIPTION_MODEL, language: str = "en") -> str:
        """
        Transcribe a single audio segment synchronously.
        
        Args:
            segment_path: Path to the audio segment file
            api_base: API base URL for the transcription service
            model: Model name to use for transcription
            language: Language code for transcription
            
        Returns:
            Transcribed text
        """
        # Update client with the specified API base
        self.client.base_url = api_base
        
        with open(segment_path, "rb") as f:
            kwargs = {
                "file": f,
                "model": model,
                "response_format": "json",
                "temperature": 0.0,
                "extra_body": dict(
                    seed=42,
                    repetition_penalty=1.2,
                ),
            }
            if language.lower() != "auto":
                kwargs["language"] = language
            print(kwargs)
            transcription = self.client.audio.transcriptions.create(**kwargs)
        return transcription.text
    
    async def transcribe_segment_async(self, segment_path: str, api_base: str = API_BASE, model: str = TRANSCRIPTION_MODEL, language: str = "en") -> str:
        """
        Transcribe a single audio segment asynchronously.
        
        Args:
            segment_path: Path to the audio segment file
            api_base: API base URL for the transcription service
            model: Model name to use for transcription
            language: Language code for transcription
            
        Returns:
            Transcribed text
        """
        # Update async client with the specified API base
        self.async_client.base_url = api_base
        
        with open(segment_path, "rb") as f:
            transcription = await self.async_client.audio.transcriptions.create(
                file=f,
                model=model,
                language=language,
                response_format="json",
                temperature=0.0,
                extra_body=dict(
                    seed=420,
                    repetition_penalty=1.5,
                    top_p=0.7
                ),
            )
        return transcription.text
    
    def _ms_to_srt_time(self, ms: int) -> str:
        """
        Convert milliseconds to SRT time format (HH:MM:SS,mmm).
        
        Args:
            ms: Milliseconds to convert
            
        Returns:
            String in SRT time format
        """
        hours = ms // 3_600_000
        ms = ms % 3_600_000
        minutes = ms // 60_000
        ms = ms % 60_000
        seconds = ms // 1_000
        ms = ms % 1_000
        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{ms:03d}"

    def _create_srt_segment(self, index: int, start_ms: int, end_ms: int, text: str) -> str:
        """
        Create an SRT segment with proper formatting.
        
        Args:
            index: Subtitle index
            start_ms: Start time in milliseconds
            end_ms: End time in milliseconds
            text: Transcribed text
            
        Returns:
            Formatted SRT segment string
        """
        start_time = self._ms_to_srt_time(start_ms)
        end_time = self._ms_to_srt_time(end_ms)
        return f"{index}\n{start_time} --> {end_time}\n{text.strip()}\n"

    def transcribe_file(self, audio_path: str, output_path: str = None, max_workers: int = 6, format: str = "srt", model_name: str = "Whisper", language: str = "en") -> str:
        """
        Transcribe a long audio file by splitting it into segments and processing them concurrently using threads.
        Returns the full transcription text.
        
        Args:
            audio_path: Path to the input audio file
            output_path: Path to save the transcription output (optional)
            max_workers: Maximum number of worker threads to use for concurrent processing
            format: Output format ('txt' for plain text, 'srt' for subtitle format)
            model_name: Name of the model to use for transcription ("Whisper" or "Malaysia Whisper")
            language: Language code for transcription ("en" for English, "ms" for Malay)
            
        Returns:
            Full transcription text
        """
        if output_path is None:
            if format == "srt":
                output_path = Path(audio_path).stem + "_transcription.srt"
            else:
                output_path = Path(audio_path).stem + "_transcription.txt"
        
        # Set API base and model based on model_name
        if model_name == "Malaysia Whisper":
            api_base = API_BASE_MALAYSIA
            model = TRANSCRIPTION_MODEL_MALAYSIA
        else:  # Default to Whisper model
            api_base = API_BASE
            model = TRANSCRIPTION_MODEL
        lang = language  # Use the requested language
        
        print(f"Processing audio file: {audio_path}")
        print(f"max_workers parameter value in transcribe_file method: {max_workers}")
        print(f"Output format: {format}")
        
        # Split audio into segments
        segment_files, temp_dir_created = self.split_audio(audio_path)
        
        # Get audio duration for end time calculation
        if not audio_path.lower().endswith('.wav'):
            # Convert to WAV to get duration
            wav_path, _ = self.convert_to_wav(audio_path)
            audio = AudioSegment.from_wav(wav_path)
            duration_ms = len(audio)
            # Clean up the converted WAV file
            if os.path.exists(wav_path):
                os.remove(wav_path)
        else:
            audio = AudioSegment.from_wav(audio_path)
            duration_ms = len(audio)
        
        # Use ThreadPoolExecutor for concurrent processing
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        full_transcription = ""
        srt_segments = []
        total_segments = len(segment_files)
        
        print(f"Starting concurrent transcription with {max_workers} workers. Max workers parameter value: {max_workers}")
        
        # Calculate start times for each segment
        start_times = []
        step_size = self.segment_length - self.overlap
        for i, start_ms in enumerate(range(0, duration_ms, step_size)):
            start_times.append(start_ms)
        
        # Process segments concurrently using threads while preserving order
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all transcription tasks with their index to maintain order
            future_to_index = {
                executor.submit(self.transcribe_segment, segment_file, api_base, model, lang): i
                for i, segment_file in enumerate(segment_files)
            }
            
            # Dictionary to store results by their original index
            results = {}
            
            # Process completed futures as they finish
            for future in as_completed(future_to_index):
                segment_index = future_to_index[future]
                segment_file = segment_files[segment_index]
                try:
                    text = future.result()
                    results[segment_index] = text
                    print(f"Completed {segment_index+1}/{total_segments}: {segment_file}")
                except Exception as e:
                    print(f"Error transcribing {segment_file}: {str(e)}")
                    results[segment_index] = ""  # Use empty string for failed transcriptions
            
            # Reconstruct full transcription in original segment order
            for i in range(len(segment_files)):
                if i in results:
                    full_transcription += results[i] + " "
                    
                    if format == "srt" and i in results and results[i].strip():
                        # Calculate end time for this segment
                        # Use the start time of the next segment as end time, or the audio duration for the last segment
                        if i + 1 < len(start_times):
                            end_ms = start_times[i + 1]
                        else:
                            end_ms = duration_ms
                        
                        # Create SRT segment
                        srt_segment = self._create_srt_segment(
                            index=i + 1,
                            start_ms=start_times[i],
                            end_ms=end_ms,
                            text=results[i]
                        )
                        srt_segments.append(srt_segment)
        
        # Write output to file based on format
        if format == "srt":
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(srt_segments))
        else:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_transcription.strip())
        
        print(f"\nFull transcription saved to: {output_path}")
        
        # Clean up segment files
        for segment_file in segment_files:
            if os.path.exists(segment_file):
                os.remove(segment_file)
        
        # Clean up the entire temporary directory if it exists
        if temp_dir_created.exists() and temp_dir_created.is_dir():
            shutil.rmtree(temp_dir_created)
            print(f"Cleaned up temporary directory: {temp_dir_created}")
        
        
        if format == "srt":
            return '\n'.join(srt_segments)
        else:
            # Apply post-processing to remove repeated phrases/words using NLTK
            processed_transcription = full_transcription.strip()
            return processed_transcription

    def remove_repeated_phrases_nltk(self, text: str) -> str:
        """
        Remove repeated phrases from transcription using NLTK.
        This function identifies and removes consecutive duplicate phrases
        that may occur due to speech-to-text artifacts.
        
        Args:
            text: The input text to process
            
        Returns:
            Text with consecutive repeated phrases removed
        """
        if not text:
            return text
            
        # Tokenize the text into words
        tokens = word_tokenize(text)
        if len(tokens) <= 1:
            return text
            
        # We'll check for repeated n-grams (1-5 words)
        result_tokens = []
        i = 0
        
        while i < len(tokens):
            # Add current token to result
            result_tokens.append(tokens[i])
            i += 1
            
            # Look for repeated n-grams starting from current position
            found_repeat = False
            max_n = min(5, (len(tokens) - i) // 2)  # Maximum n-gram size to check
            
            for n in range(1, max_n + 1):
                # Get the current n-gram
                if i + n > len(tokens):
                    continue
                    
                current_gram = tuple(tokens[i:i + n])
                
                # Check if the same n-gram appears immediately after
                if i + n + n > len(tokens):
                    continue
                    
                next_gram = tuple(tokens[i + n:i + n + n])
                
                if current_gram == next_gram:
                    # Found a repeated phrase, skip the duplicate
                    i += n * 2
                    found_repeat = True
                    break
            
            # If no repeat was found, add tokens one by one
            if not found_repeat:
                while i < len(tokens):
                    result_tokens.append(tokens[i])
                    i += 1
        
        # Reconstruct text from tokens
        # Simple reconstruction - join with spaces
        # For more sophisticated reconstruction, consider using nltk.tokenize.treebank
        result = ' '.join(result_tokens)
        
        # Clean up extra whitespace
        result = ' '.join(result.split())
        
        return result



def main():
    # Default input file
    input_file = "WhatsApp Audio 2025-08-30 at 4.55.42 PM.mp4"
    
    # Check if file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        print("Available files in current directory:")
        for file in os.listdir('.'):
            if file.endswith(('.mp3', '.m4a', '.wav', '.mp4', '.m4b')):
                print(f"  - {file}")
        sys.exit(1)
    
    # Create transcriber instance
    transcriber = AudioTranscriber()
    
    # Transcribe the file with SRT format
    transcription = transcriber.transcribe_file(input_file, format="srt")
    
    print("\nFinal Transcription:")
    print("-" * 50)
    print(transcription)


if __name__ == "__main__":
    main()
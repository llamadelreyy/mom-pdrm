import { getStoredValue } from './localStorage';

// Dynamic base URL that works both locally and with port forwarding
// Use Vite's proxy for all API requests
const BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage;
    try {
      const error = await response.json();
      errorMessage = error.detail;
    } catch {
      errorMessage = 'Ralat tidak dijangka telah berlaku';
    }
    throw new Error(errorMessage);
  }
  return response;
};

const getHeaders = () => {
  const token = getStoredValue('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const api = {
  async register(userData) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    await handleResponse(response);
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,  // Backend now expects 'email' field
        password
      })
    });

    await handleResponse(response);
    return response.json();
  },

  async uploadAudio(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredValue('token')}`,
      },
      body: formData
    });

    await handleResponse(response);
    return response.json();
  },

  async transcribeAudio(fileId, title) {
    const response = await fetch(`${BASE_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredValue('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_id: fileId,
        title: title,
        max_workers: 6,
        model_name: 'Whisper Malaysia',
        language: 'auto'
      })
    });

    await handleResponse(response);
    return response.json();
  },

  async getTranscriptionStatus(transcriptId) {
    const response = await fetch(`${BASE_URL}/progress/${transcriptId}`, {
      headers: {
        'Authorization': `Bearer ${getStoredValue('token')}`
      }
    });

    await handleResponse(response);
    return response.json();
  },

  async getTranscript(id) {
    const response = await fetch(`${BASE_URL}/transcripts/${id}`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.json();
  },

  async updateTranscript(id, text) {
    const response = await fetch(`${BASE_URL}/transcripts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });

    await handleResponse(response);
    return response.json();
  },

  async deleteTranscript(id) {
    const response = await fetch(`${BASE_URL}/transcripts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    await handleResponse(response);
    return true;
  },

  async generateReport(transcriptId, prompt, title) {
    const response = await fetch(`${BASE_URL}/generate-report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        transcript_id: transcriptId,
        prompt: prompt,
        title: title
      })
    });

    await handleResponse(response);
    return response.json();
  },

  async getReportProgress(reportId) {
    const response = await fetch(`${BASE_URL}/reports/${reportId}/progress`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.json();
  },

  async getReport(reportId) {
    const response = await fetch(`${BASE_URL}/reports/${reportId}`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.blob();
  },

  async listReports() {
    const response = await fetch(`${BASE_URL}/reports`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.json();
  },

  async deleteReport(reportId) {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    const response = await fetch(`${BASE_URL}/reports/${reportId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    await handleResponse(response);
    return true;
  },

  async getStatistics() {
    const response = await fetch(`${BASE_URL}/statistics`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.json();
  },

  async getUserStatistics(period = 'all') {
    const response = await fetch(`${BASE_URL}/statistics/users/${period}`, {
      headers: getHeaders()
    });

    await handleResponse(response);
    return response.json();
  }
};
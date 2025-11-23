import { useState, useEffect } from 'react';

export const getStoredValue = (key, defaultValue = null) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setStoredValue = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const removeStoredValue = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export const useLocalStorage = (key, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    return getStoredValue(key, defaultValue);
  });

  useEffect(() => {
    setStoredValue(getStoredValue(key, defaultValue));
  }, [key, defaultValue]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      setStoredValue(key, valueToStore);
    } catch (error) {
      console.error('Error setting localStorage value:', error);
    }
  };

  return [storedValue, setValue];
};

export const clearStaleData = () => {
  try {
    // Get all transcripts
    const transcripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
    
    // Filter out stale transcripts (those still marked as processing or pending)
    const validTranscripts = transcripts.filter(transcript => {
      if (!transcript || !transcript.id) return false;
      
      // Keep completed and error transcripts
      if (transcript.status === 'completed' || transcript.status === 'error') {
        return true;
      }
      
      // For processing/pending transcripts, check if they're stale (older than 1 hour)
      if (transcript.status === 'processing' || transcript.status === 'pending') {
        const transcriptDate = new Date(transcript.date);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return transcriptDate > oneHourAgo;
      }
      
      return false;
    });
    
    // Update localStorage with cleaned data
    localStorage.setItem('transcripts', JSON.stringify(validTranscripts));
    
  } catch (error) {
    console.error('Error clearing stale data:', error);
  }
};
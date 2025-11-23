import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Progress,
  CloseButton,
  useColorModeValue,
  Box,
  Text,
  keyframes,
  Icon,
  Circle,
  Flex,
} from '@chakra-ui/react';
import { FaClock, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { api } from '../utils/api';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const StatusNotification = () => {
  const [notifications, setNotifications] = useState([]);
  
  // All useColorModeValue hooks must be called at the top level
  const notificationBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');
  const closeHoverBg = useColorModeValue('gray.100', 'gray.700');
  const progressBg = useColorModeValue('gray.100', 'gray.700');
  const messageColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const checkTranscriptionStatus = async () => {
      const transcripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      const processingTranscripts = transcripts.filter(t =>
        t.status === 'processing' || t.status === 'pending'
      );

      if (processingTranscripts.length > 0) {
        try {
          const updatedNotifications = [];
          const updatedTranscripts = [...transcripts];
          let hasUpdates = false;

          for (const transcript of processingTranscripts) {
            try {
              const status = await api.getTranscriptionStatus(transcript.id);
              
              // Update transcript status in local array
              const transcriptIndex = updatedTranscripts.findIndex(t => t.id === transcript.id);
              if (transcriptIndex !== -1) {
                if (status.status !== updatedTranscripts[transcriptIndex].status ||
                    status.progress !== updatedTranscripts[transcriptIndex].progress) {
                  updatedTranscripts[transcriptIndex] = {
                    ...updatedTranscripts[transcriptIndex],
                    status: status.status,
                    progress: status.progress
                  };
                  hasUpdates = true;
                }
              }

              if (status.status !== 'completed') {
                updatedNotifications.push({
                  id: transcript.id,
                  title: transcript.title,
                  progress: status.progress || 0,
                  status: status.status,
                  message: status.message
                });
              } else if (status.status === 'completed' && !transcript.notifiedCompletion) {
                // Show completion notification
                const completedTranscript = updatedTranscripts[transcriptIndex];
                completedTranscript.notifiedCompletion = true;
                hasUpdates = true;
              }
            } catch (error) {
              console.error('Error checking transcript status:', error);
              updatedNotifications.push({
                id: transcript.id,
                title: transcript.title,
                progress: 0,
                status: 'error',
                message: 'Ralat semasa menyemak status'
              });
            }
          }

          // Update localStorage if there were changes
          if (hasUpdates) {
            localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
          }

          setNotifications(updatedNotifications);
        } catch (error) {
          console.error('Error checking transcription status:', error);
        }
      } else {
        setNotifications([]);
      }
    };

    const interval = setInterval(checkTranscriptionStatus, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return FaSpinner;
      case 'pending':
        return FaClock;
      case 'error':
        return FaExclamationTriangle;
      default:
        return FaSpinner;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'blue.500';
      case 'pending':
        return 'orange.500';
      case 'error':
        return 'red.500';
      default:
        return 'gray.500';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <Box
      position="fixed"
      bottom={6}
      right={6}
      maxW="400px"
      zIndex={1500}
    >
      <VStack spacing={4} align="stretch">
        {notifications.map((notification, index) => (
          <Box
            key={notification.id}
            bg={notificationBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            boxShadow={`0 10px 25px ${shadowColor}`}
            overflow="hidden"
            position="relative"
            animation={`${slideIn} 0.4s ease-out`}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: `0 15px 35px ${shadowColor}`,
            }}
            transition="all 0.3s ease"
          >
            {/* Accent Border */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              height="4px"
              bgGradient={`linear(to-r, ${getStatusColor(notification.status)}, ${getStatusColor(notification.status).replace('.500', '.300')})`}
            />
            
            <Box p={6}>
              <Flex align="flex-start" justify="space-between" mb={4}>
                <Flex align="center" spacing={3}>
                  <Circle
                    size="40px"
                    bg={useColorModeValue(`${getStatusColor(notification.status).split('.')[0]}.50`, `${getStatusColor(notification.status).split('.')[0]}.900`)}
                    color={getStatusColor(notification.status)}
                    animation={notification.status === 'processing' ? `${pulse} 2s infinite` : 'none'}
                  >
                    <Icon
                      as={getStatusIcon(notification.status)}
                      boxSize={5}
                      animation={notification.status === 'processing' ? 'spin 2s linear infinite' : 'none'}
                    />
                  </Circle>
                  <Box ml={3} flex="1">
                    <Text fontWeight="700" fontSize="sm" mb={1} color={useColorModeValue('gray.800', 'white')}>
                      {notification.status === 'error' ? 'Ralat Pemprosesan' :
                       notification.status === 'pending' ? 'Menunggu Giliran' : 'Memproses Transkrip'}
                    </Text>
                    <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} noOfLines={2}>
                      {notification.title}
                    </Text>
                  </Box>
                </Flex>
                
                <CloseButton
                  size="sm"
                  onClick={() => removeNotification(notification.id)}
                  animation={`${pulse} 2s infinite`}
                  _hover={{
                    bg: useColorModeValue('gray.100', 'gray.700'),
                  }}
                />
              </Flex>

              <VStack spacing={3}>
                <Progress
                  value={notification.progress}
                  size="md"
                  width="full"
                  colorScheme={getStatusColor(notification.status).split('.')[0]}
                  borderRadius="full"
                  isIndeterminate={notification.status === 'pending'}
                  bg={useColorModeValue('gray.100', 'gray.700')}
                />
                
                <Flex justify="space-between" align="center" w="full">
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                    {notification.message || (
                      notification.status === 'processing'
                        ? `Sedang diproses...`
                        : notification.status === 'pending'
                        ? 'Menunggu pemprosesan...'
                        : 'Ralat semasa pemprosesan'
                    )}
                  </Text>
                  
                  {notification.status === 'processing' && (
                    <Text fontSize="xs" fontWeight="700" color={getStatusColor(notification.status)}>
                      {notification.progress}%
                    </Text>
                  )}
                </Flex>
              </VStack>
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default StatusNotification;
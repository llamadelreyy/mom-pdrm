import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const bgColor = useColorModeValue('#fafbfc', 'gray.900');
  const contentBg = useColorModeValue('transparent', 'gray.900');

  return (
    <Flex minH="100vh" bg={bgColor}>
      <Sidebar />
      <Box
        flex="1"
        bg={contentBg}
        p={8}
        ml="280px" // Width of sidebar
        overflowY="auto"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgGradient: useColorModeValue(
            'linear(to-br, rgba(2, 125, 250, 0.01), rgba(113, 128, 150, 0.01))',
            'linear(to-br, rgba(2, 125, 250, 0.02), rgba(113, 128, 150, 0.02))'
          ),
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Box position="relative" zIndex={1}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default MainLayout;
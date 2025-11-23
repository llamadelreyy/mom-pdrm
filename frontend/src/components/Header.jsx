import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Avatar,
  HStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../utils/localStorage';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const [, setToken] = useLocalStorage('token', null);
  const [username] = useLocalStorage('username', '');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={8}
      py={4}
    >
      <Flex justify="flex-end" align="center">
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle theme"
            icon={
              colorMode === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              )
            }
            variant="ghost"
            onClick={toggleColorMode}
          />

          <Menu>
            <MenuButton>
              <HStack spacing={3}>
                <Avatar size="sm" name={username} />
                <Text fontSize="sm" fontWeight="medium">
                  {username}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleLogout}>Log Keluar</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
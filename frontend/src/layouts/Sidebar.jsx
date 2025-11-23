import React from 'react';
import {
  Box,
  VStack,
  Icon,
  Text,
  Link,
  Divider,
  useColorModeValue,
  Image,
  Flex,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaFileAudio,
  FaFileAlt,
  FaFileWord,
  FaSignOutAlt
} from 'react-icons/fa';
import { useLocalStorage } from '../utils/localStorage';

const MenuItem = ({ icon, children, to, isActive, onClick }) => {
  const activeBg = useColorModeValue('rgba(255, 255, 255, 0.15)', 'primary.700');
  const activeColor = useColorModeValue('white', 'primary.300');
  const hoverBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'gray.700');
  const defaultColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'gray.300');
  
  if (onClick) {
    return (
      <Flex
        align="center"
        p={4}
        borderRadius="xl"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : defaultColor}
        transition="all 0.2s"
        position="relative"
        overflow="hidden"
        cursor="pointer"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          transform: 'translateX(4px)',
        }}
        _before={isActive ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          bg: 'white',
          borderRadius: 'full',
        } : {}}
        onClick={onClick}
      >
        <Icon
          as={icon}
          boxSize={5}
          mr={4}
          transition="all 0.2s"
          color={isActive ? activeColor : defaultColor}
        />
        <Text
          fontWeight={isActive ? '700' : '500'}
          fontSize="sm"
          transition="all 0.2s"
        >
          {children}
        </Text>
      </Flex>
    );
  }

  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p={4}
        borderRadius="xl"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : defaultColor}
        transition="all 0.2s"
        position="relative"
        overflow="hidden"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          transform: 'translateX(4px)',
        }}
        _before={isActive ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          bg: 'white',
          borderRadius: 'full',
        } : {}}
      >
        <Icon
          as={icon}
          boxSize={5}
          mr={4}
          transition="all 0.2s"
          color={isActive ? activeColor : defaultColor}
        />
        <Text
          fontWeight={isActive ? '700' : '500'}
          fontSize="sm"
          transition="all 0.2s"
        >
          {children}
        </Text>
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [, setToken] = useLocalStorage('token', null);
  const [, setName] = useLocalStorage('name', null);
  
  const menuItems = [
    { icon: FaHome, text: 'Dashboard', path: '/' },
    { icon: FaFileAudio, text: 'Urus Audio', path: '/manage-audio' },
    { icon: FaFileAlt, text: 'Urus Transkrip', path: '/manage-transcripts' },
    { icon: FaFileWord, text: 'Urus Laporan', path: '/manage-reports' },
  ];

  const handleLogout = () => {
    setToken(null);
    setName(null);
    localStorage.clear(); // Clear all local storage
    navigate('/login');
  };

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="100vh"
      w="280px"
      bg="#1f1b51"
      borderRight="2px"
      borderRightColor={borderColor}
      shadow="xl"
      zIndex={1000}
      overflow="hidden"
    >
      {/* Background gradient */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="linear(to-b, rgba(31, 27, 81, 0.9), rgba(31, 27, 81, 0.95))"
        pointerEvents="none"
      />
      
      <VStack spacing={1} align="stretch" position="relative" zIndex={1} py={6} w="full">
        {/* Logo Section */}
        <Box px={6} mb={6} display="flex" justifyContent="center">
          <Box
            p={4}
            borderRadius="2xl"
            bg="rgba(255, 255, 255, 0.1)"
            shadow="lg"
            transition="all 0.3s"
            _hover={{
              transform: 'scale(1.05)',
              shadow: 'xl',
              bg: "rgba(255, 255, 255, 0.15)"
            }}
          >
            <Image
              src="/asset/logo.png"
              alt="PDRM Logo"
              maxH="80px"
              objectFit="contain"
            />
          </Box>
        </Box>

        {/* Menu Items */}
        <VStack spacing={1} align="stretch" px={2}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              to={item.path}
              isActive={location.pathname === item.path}
            >
              {item.text}
            </MenuItem>
          ))}
          
          {/* Divider */}
          <Divider
            my={4}
            borderColor="rgba(255, 255, 255, 0.2)"
            borderWidth={1}
            mx={4}
          />
          
          {/* Logout */}
          <MenuItem
            icon={FaSignOutAlt}
            onClick={handleLogout}
            isActive={false}
          >
            Log Keluar
          </MenuItem>
        </VStack>
      </VStack>
      
      {/* Bottom decorative element */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="3px"
        bgGradient="linear(to-r, primary.400, secondary.400, primary.400)"
      />
    </Box>
  );
};

export default Sidebar;
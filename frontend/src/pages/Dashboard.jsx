import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  useColorModeValue,
  Icon,
  Flex,
  Text,
  VStack,
  Container,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Circle,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useToast,
  Spinner,
  Center,
  Button,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem as ChakraMenuItem,
} from '@chakra-ui/react';
import {
  FaFileAudio,
  FaFileAlt,
  FaClock,
  FaCheck,
  FaUsers,
  FaUserPlus,
  FaChartLine,
  FaEye,
  FaFilter,
  FaCalendarAlt,
  FaDownload,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { api } from '../utils/api';

const ModernStatCard = ({ label, number, helpText, icon, gradient, accentColor, trend, percentage, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.50', 'gray.600');
  const progressBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Card
      bg={bgColor}
      borderRadius="2xl"
      border="1px"
      borderColor={borderColor}
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.05)"
      transition="all 0.3s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        transform: "translateY(-4px)",
      }}
    >
      <CardBody p={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              {label}
            </Text>
            {isLoading ? (
              <Spinner size="lg" color={accentColor} mt={2} />
            ) : (
              <HStack spacing={2} align="baseline">
                <Text fontSize="4xl" fontWeight="900" color={accentColor} lineHeight="1">
                  {number?.toLocaleString()}
                </Text>
                {percentage && (
                  <Badge 
                    colorScheme={percentage > 0 ? "green" : "red"} 
                    variant="subtle" 
                    borderRadius="full"
                    px={2}
                    fontSize="xs"
                  >
                    <Icon as={percentage > 0 ? FaArrowUp : FaArrowDown} mr={1} />
                    {Math.abs(percentage)}%
                  </Badge>
                )}
              </HStack>
            )}
            {helpText && (
              <Text fontSize="sm" color="gray.500" fontWeight="500" mt={2}>
                {helpText}
              </Text>
            )}
          </Box>
          <Circle size="70px" bg={`${accentColor.split('.')[0]}.50`} color={accentColor}>
            <Icon as={icon} boxSize={8} />
          </Circle>
        </Flex>
        
        {trend !== undefined && (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="xs" color="gray.500">Activity Progress</Text>
              <Text fontSize="xs" fontWeight="600" color={trend > 0 ? "green.500" : "orange.500"}>
                {trend} recent
              </Text>
            </Flex>
            <Progress
              value={Math.min(trend * 10, 100)}
              size="sm"
              colorScheme={accentColor.split('.')[0]}
              borderRadius="full"
              bg={progressBg}
            />
          </Box>
        )}
      </CardBody>
      
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="3px"
        bgGradient={gradient}
      />
    </Card>
  );
};

const TimeFilter = ({ selectedPeriod, onPeriodChange }) => {
  const generateOptions = () => {
    const options = [{ value: 'all', label: 'Semua Masa' }];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('ms-MY', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<FaFilter />}
        leftIcon={<FaCalendarAlt />}
        colorScheme="primary"
        variant="outline"
        size="md"
        borderRadius="xl"
        fontWeight="600"
        px={6}
      >
        {selectedPeriod === 'all' ? 'Semua Masa' : 
         generateOptions().find(opt => opt.value === selectedPeriod)?.label || 'Pilih Tempoh'}
      </MenuButton>
      <MenuList borderRadius="xl" shadow="xl">
        {generateOptions().map(option => (
          <ChakraMenuItem 
            key={option.value} 
            onClick={() => onPeriodChange(option.value)}
            icon={<FaCalendarAlt />}
            borderRadius="lg"
            mx={2}
            my={1}
          >
            {option.label}
          </ChakraMenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const QuickInsights = ({ statistics }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const insightBg = useColorModeValue('gray.50', 'gray.700');
  
  const insights = [
    {
      label: "Kadar Keaktifan",
      value: "87%",
      icon: FaArrowUp,
      color: "green.500",
      trend: "+12%"
    },
    {
      label: "Transkrip Hari Ini", 
      value: statistics?.overview?.recent_transcripts || "0",
      icon: FaFileAlt,
      color: "blue.500",
      trend: "+5"
    },
    {
      label: "Laporan Pending",
      value: "1", 
      icon: FaClock,
      color: "orange.500",
      trend: "Sama"
    }
  ];

  return (
    <Card bg={bgColor} borderRadius="2xl" boxShadow="card" h="full">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" fontWeight="800" color="#1f1b51">Insight Pantas</Heading>
          <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={3}>Real-time</Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={6}>
          {insights.map((insight, index) => (
            <Box key={index} w="full" p={4} bg={insightBg} borderRadius="xl">
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={3}>
                  <Circle size="40px" bg={`${insight.color.split('.')[0]}.50`} color={insight.color}>
                    <Icon as={insight.icon} boxSize={5} />
                  </Circle>
                  <Text fontSize="sm" fontWeight="600">{insight.label}</Text>
                </HStack>
                <VStack spacing={0} align="end">
                  <Text fontSize="xl" fontWeight="900" color={insight.color}>
                    {insight.value}
                  </Text>
                  <Text fontSize="xs" color="gray.500">{insight.trend}</Text>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
};

const ActivityChart = ({ title, period, data = null }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Card bg={bgColor} borderRadius="2xl" boxShadow="card" h="350px">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" fontWeight="800" color="#1f1b51">{title}</Heading>
          <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3}>
            {period === 'all' ? 'Keseluruhan' : 'Bulanan'}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <Center h="full">
          <VStack spacing={4}>
            <Circle size="80px" bg="gray.100" color="gray.400">
              <Icon as={FaChartLine} boxSize={10} />
            </Circle>
            <Text color="gray.500" textAlign="center" fontWeight="600">
              Visualisasi {title} 
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Carta interaktif untuk tempoh: {period === 'all' ? 'Semua masa' : period}
            </Text>
            <Badge colorScheme="blue" variant="outline">Coming Soon</Badge>
          </VStack>
        </Center>
      </CardBody>
    </Card>
  );
};

const UserActivityTable = ({ users, period }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const theadBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Never') return 'Tidak pernah';
    try {
      return new Date(dateString).toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Tidak sah';
    }
  };

  const getActivityStatus = (lastLogin) => {
    if (!lastLogin || lastLogin === 'Never') return 'inactive';
    
    const now = new Date();
    const login = new Date(lastLogin);
    const daysDiff = (now - login) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) return 'active';
    if (daysDiff <= 30) return 'moderate';
    return 'inactive';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'moderate': return 'yellow';
      case 'inactive': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'moderate': return 'Sederhana';
      case 'inactive': return 'Tidak Aktif';
      default: return 'Unknown';
    }
  };

  if (!users || users.length === 0) {
    return (
      <Card bg={bgColor} borderRadius="2xl" boxShadow="card">
        <CardBody>
          <Center py={12}>
            <VStack spacing={4}>
              <Circle size="60px" bg="gray.100" color="gray.400">
                <Icon as={FaUsers} boxSize={6} />
              </Circle>
              <Text color="gray.500" fontWeight="600">Tiada pengguna untuk tempoh yang dipilih</Text>
            </VStack>
          </Center>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={bgColor} borderRadius="2xl" boxShadow="card">
      <CardHeader>
        <Heading size="md" fontWeight="800" color="#1f1b51">
          Aktiviti Pengguna ({users.length} pengguna)
        </Heading>
      </CardHeader>
      <CardBody>
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg={theadBg}>
              <Tr>
                <Th fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider">
                  Pengguna
                </Th>
                <Th fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider">
                  Emel
                </Th>
                <Th fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider">
                  Tarikh Daftar
                </Th>
                <Th fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider">
                  Log Masuk Terakhir
                </Th>
                <Th fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider">
                  Status
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user, index) => {
                const status = getActivityStatus(user.last_login);
                return (
                  <Tr key={index} _hover={{ bg: hoverBg }}>
                    <Td py={4}>
                      <HStack spacing={3}>
                        <Circle size="35px" bg={`${getStatusColor(status)}.100`} color={`${getStatusColor(status)}.500`}>
                          <Icon as={FaUsers} boxSize={4} />
                        </Circle>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="600" fontSize="sm">{user.full_name}</Text>
                          <Text fontSize="xs" color="gray.500">@{user.username}</Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td py={4}>
                      <Text fontSize="sm">{user.email}</Text>
                    </Td>
                    <Td py={4}>
                      <Text fontSize="sm">{formatDate(user.created_at)}</Text>
                    </Td>
                    <Td py={4}>
                      <Text fontSize="sm">{formatDate(user.last_login)}</Text>
                    </Td>
                    <Td py={4}>
                      <Badge
                        colorScheme={getStatusColor(status)}
                        variant="solid"
                        borderRadius="full"
                        px={4}
                        py={1}
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {getStatusText(status)}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // All useColorModeValue hooks must be called at the top level
  const headingColor = useColorModeValue('#1f1b51', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    loadStatistics();
    loadUserStatistics('all');
  }, []);

  useEffect(() => {
    loadUserStatistics(selectedPeriod);
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await api.getStatistics();
      setStatistics(data);
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Gagal memuat statistik',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStatistics = async (period) => {
    try {
      setUserLoading(true);
      const data = await api.getUserStatistics(period);
      setUserStats(data);
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Gagal memuat statistik pengguna',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUserLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <Center minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="primary.500" thickness="4px" />
            <Text color="gray.500" fontSize="lg" fontWeight="600">Memuatkan analitik...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={6}>
      {/* Modern Header with Filtering */}
      <Box 
        mb={8} 
        p={8} 
        bg="linear-gradient(135deg, #1f1b51 0%, #2d2875 100%)"
        borderRadius="3xl"
        color="white"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          bg: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="8"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1,
        }}
      >
        <Flex justify="space-between" align="center" position="relative" zIndex={1}>
          <VStack align="start" spacing={3}>
            <Heading 
              size="3xl" 
              fontWeight="900"
              letterSpacing="tight"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
            >
              Dashboard Analitik
            </Heading>
            <Text fontSize="xl" opacity={0.9} fontWeight="500">
              Pantauan Real-time & Pelaporan Sistem
            </Text>
            <HStack spacing={4}>
              <Badge colorScheme="whiteAlpha" variant="solid" px={3} py={1} borderRadius="full">
                Live Data
              </Badge>
              <Text fontSize="sm" opacity={0.8}>
                Kemaskini: {new Date().toLocaleTimeString('ms-MY')}
              </Text>
            </HStack>
          </VStack>
          
          <VStack spacing={4}>
            <TimeFilter 
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <Button
              leftIcon={<FaDownload />}
              colorScheme="whiteAlpha"
              variant="solid"
              size="sm"
              borderRadius="xl"
              onClick={loadStatistics}
              fontWeight="600"
            >
              Refresh Data
            </Button>
          </VStack>
        </Flex>
      </Box>

      {/* Modern Tabbed Interface */}
      <Tabs variant="unstyled" colorScheme="primary" index={activeTab} onChange={setActiveTab}>
        <TabList 
          mb={8} 
          borderRadius="2xl" 
          bg={cardBg} 
          p={2} 
          shadow="md"
          border="1px"
          borderColor={borderColor}
        >
          <Tab 
            borderRadius="xl" 
            fontWeight="700" 
            px={6}
            _selected={{ 
              bg: '#1f1b51', 
              color: 'white',
              shadow: 'md'
            }}
            _hover={{
              bg: hoverBg
            }}
          >
            <Icon as={FaChartLine} mr={2} /> Ringkasan Eksekutif
          </Tab>
          <Tab 
            borderRadius="xl" 
            fontWeight="700" 
            px={6}
            _selected={{ 
              bg: '#1f1b51', 
              color: 'white',
              shadow: 'md'
            }}
            _hover={{
              bg: hoverBg
            }}
          >
            <Icon as={FaUsers} mr={2} /> Analitik Pengguna
          </Tab>
          <Tab 
            borderRadius="xl" 
            fontWeight="700" 
            px={6}
            _selected={{ 
              bg: '#1f1b51', 
              color: 'white',
              shadow: 'md'
            }}
            _hover={{
              bg: hoverBg
            }}
          >
            <Icon as={FaFileAlt} mr={2} /> Trend Aktiviti
          </Tab>
        </TabList>

        <TabPanels>
          {/* Executive Overview Tab */}
          <TabPanel>
            <VStack spacing={8}>
              {/* Key Metrics */}
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6} w="full">
                <ModernStatCard
                  label="Total Pengguna Aktif"
                  number={statistics?.overview?.total_users || 0}
                  helpText="Pengguna berdaftar dalam sistem"
                  icon={FaUsers}
                  gradient="linear(to-br, purple.400, purple.600)"
                  accentColor="purple.500"
                  percentage={15}
                  isLoading={loading}
                />
                
                <ModernStatCard
                  label="Fail Audio Dimuat Naik"
                  number={statistics?.overview?.total_audio_files || 0}
                  helpText={`${statistics?.overview?.recent_uploads || 0} dalam 30 hari`}
                  icon={FaFileAudio}
                  gradient="linear(to-br, blue.400, blue.600)"
                  accentColor="blue.500"
                  trend={statistics?.overview?.recent_uploads || 0}
                  percentage={8}
                  isLoading={loading}
                />
                
                <ModernStatCard
                  label="Transkrip Dijana"
                  number={statistics?.overview?.total_transcripts || 0}
                  helpText="Proses transkripsi selesai"
                  icon={FaFileAlt}
                  gradient="linear(to-br, green.400, green.600)"
                  accentColor="green.500"
                  trend={statistics?.overview?.recent_transcripts || 0}
                  percentage={23}
                  isLoading={loading}
                />
                
                <ModernStatCard
                  label="Laporan Diterbitkan"
                  number={statistics?.overview?.total_reports || 0}
                  helpText="Dokumen laporan siap"
                  icon={FaCheck}
                  gradient="linear(to-br, orange.400, orange.600)"
                  accentColor="orange.500"
                  trend={statistics?.overview?.recent_reports || 0}
                  percentage={-5}
                  isLoading={loading}
                />
              </SimpleGrid>

              {/* Secondary Analytics Row */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full">
                <QuickInsights statistics={statistics} />
                <ActivityChart title="Trend Keseluruhan" period={selectedPeriod} data={statistics} />
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* Users Analytics Tab */}
          <TabPanel>
            <VStack spacing={8}>
              {/* User Statistics Summary */}
              {userStats && (
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} width="full">
                  <Card textAlign="center" p={6} bg="linear-gradient(135deg, purple.400, purple.600)" color="white" borderRadius="2xl">
                    <Icon as={FaUserPlus} boxSize={10} mb={4} />
                    <Text fontSize="3xl" fontWeight="900" mb={1}>
                      {userStats.user_count}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" opacity={0.9}>
                      {selectedPeriod === 'all' ? 'Total Pengguna' : 'Pengguna Tempoh Ini'}
                    </Text>
                  </Card>
                  
                  <Card textAlign="center" p={6} bg="linear-gradient(135deg, green.400, green.600)" color="white" borderRadius="2xl">
                    <Icon as={FaEye} boxSize={10} mb={4} />
                    <Text fontSize="3xl" fontWeight="900" mb={1}>
                      {userStats.users?.filter(u => u.last_login && u.last_login !== 'Never').length || 0}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" opacity={0.9}>
                      Pernah Log Masuk
                    </Text>
                  </Card>
                  
                  <Card textAlign="center" p={6} bg="linear-gradient(135deg, blue.400, blue.600)" color="white" borderRadius="2xl">
                    <Icon as={FaArrowUp} boxSize={10} mb={4} />
                    <Text fontSize="3xl" fontWeight="900" mb={1}>
                      {userStats.users?.filter(u => {
                        if (!u.last_login || u.last_login === 'Never') return false;
                        const daysDiff = (new Date() - new Date(u.last_login)) / (1000 * 60 * 60 * 24);
                        return daysDiff <= 7;
                      }).length || 0}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" opacity={0.9}>
                      Aktif Seminggu
                    </Text>
                  </Card>
                  
                  <Card textAlign="center" p={6} bg="linear-gradient(135deg, red.400, red.600)" color="white" borderRadius="2xl">
                    <Icon as={FaClock} boxSize={10} mb={4} />
                    <Text fontSize="3xl" fontWeight="900" mb={1}>
                      {userStats.users?.filter(u => {
                        if (!u.last_login || u.last_login === 'Never') return true;
                        const daysDiff = (new Date() - new Date(u.last_login)) / (1000 * 60 * 60 * 24);
                        return daysDiff > 30;
                      }).length || 0}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" opacity={0.9}>
                      Tidak Aktif
                    </Text>
                  </Card>
                </SimpleGrid>
              )}

              {userLoading ? (
                <Center py={16}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color="primary.500" thickness="4px" />
                    <Text color="gray.500" fontWeight="600">Memuat data pengguna...</Text>
                  </VStack>
                </Center>
              ) : (
                <UserActivityTable 
                  users={userStats?.users || []} 
                  period={selectedPeriod} 
                />
              )}
            </VStack>
          </TabPanel>

          {/* Activity Trends Tab */}
          <TabPanel>
            <VStack spacing={8}>
              <Box textAlign="center" mb={4}>
                <Heading size="lg" color={headingColor} mb={2} fontWeight="800">
                  Analisis Trend Aktiviti
                </Heading>
                <Text fontSize="lg" color="gray.500">
                  Data terperinci untuk tempoh: {selectedPeriod === 'all' ? 'Semua masa' : selectedPeriod}
                </Text>
              </Box>
              
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full">
                <ActivityChart 
                  title="Upload Audio" 
                  period={selectedPeriod} 
                  data={statistics} 
                />
                <ActivityChart 
                  title="Aktiviti Transkrip" 
                  period={selectedPeriod} 
                  data={statistics} 
                />
              </SimpleGrid>
              
              <ActivityChart 
                title="Penjanaan Laporan (Bulanan)" 
                period={selectedPeriod} 
                data={statistics}
              />
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default Dashboard;
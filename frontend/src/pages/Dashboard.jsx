import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
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
  Card,
  CardBody,
  CardHeader,
  useToast,
  Spinner,
  Center,
  Button,
  Progress,
  Circle,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Portal,
} from '@chakra-ui/react';
import {
  FaFileAudio,
  FaFileAlt,
  FaUsers,
  FaCheck,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
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

const DateRangeFilter = ({ startDate, endDate, onDateRangeChange, onApplyFilter }) => {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const bgColor = useColorModeValue('white', 'gray.800');

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      const startStr = startDate.toLocaleDateString('ms-MY', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      const endStr = endDate.toLocaleDateString('ms-MY', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      return `${startStr} - ${endStr}`;
    } else if (startDate) {
      return `Dari: ${startDate.toLocaleDateString('ms-MY', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })}`;
    }
    return "Semua Masa";
  };

  const applyFilter = (onClose) => {
    onDateRangeChange(tempStartDate, tempEndDate);
    onApplyFilter();
    onClose();
  };

  const clearFilter = (onClose) => {
    setTempStartDate(null);
    setTempEndDate(null);
    onDateRangeChange(null, null);
    onApplyFilter();
    onClose();
  };

  return (
    <Popover placement="bottom-end" closeOnBlur={false}>
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <Button
              leftIcon={<FaCalendarAlt />}
              colorScheme="primary"
              variant="outline"
              size="md"
              borderRadius="xl"
              fontWeight="600"
              px={6}
              bg={bgColor}
            >
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <Portal>
            <PopoverContent minW="350px" border="1px" borderColor="gray.200" boxShadow="2xl">
              <PopoverArrow />
              <PopoverBody p={4}>
                <DatePicker
                  selected={tempStartDate}
                  onChange={handleDateChange}
                  startDate={tempStartDate}
                  endDate={tempEndDate}
                  selectsRange
                  inline
                  locale="ms"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih tarikh"
                  isClearable
                />
                <HStack mt={3} justify="space-between">
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    Batal
                  </Button>
                  <HStack spacing={2}>
                    <Button size="sm" colorScheme="gray" onClick={() => clearFilter(onClose)}>
                      Reset
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="primary" 
                      onClick={() => applyFilter(onClose)}
                      isDisabled={!tempStartDate || !tempEndDate}
                    >
                      Aplai
                    </Button>
                  </HStack>
                </HStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </>
      )}
    </Popover>
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
      icon: FaCheck,
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
            {period || 'Keseluruhan'}
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
              Carta interaktif untuk tempoh yang dipilih
            </Text>
            <Badge colorScheme="blue" variant="outline">Coming Soon</Badge>
          </VStack>
        </Center>
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadStatistics();
  }, []);

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

  const loadFilteredStatistics = async () => {
    try {
      setLoading(true);
      // Here you would make an API call with date range parameters
      // You can pass startDate and endDate as query parameters to your API
      const params = {};
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      const data = await api.getStatistics(params);
      setStatistics(data);
      
      toast({
        title: 'Berjaya',
        description: `Data dikemaskini untuk tempoh ${startDate ? startDate.toLocaleDateString('ms-MY') : ''} - ${endDate ? endDate.toLocaleDateString('ms-MY') : ''}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Gagal memuat statistik untuk tempoh yang dipilih',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      loadFilteredStatistics();
    } else {
      loadStatistics();
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
      {/* Modern Header with Date Filtering */}
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
          
          <DateRangeFilter 
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
            onApplyFilter={handleApplyFilter}
          />
        </Flex>
      </Box>

      {/* Main Dashboard Content */}
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
          <ActivityChart 
            title="Trend Keseluruhan" 
            period={startDate && endDate ? 
              `${startDate.toLocaleDateString('ms-MY')} - ${endDate.toLocaleDateString('ms-MY')}` : 
              'Semua Masa'
            } 
            data={statistics} 
          />
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default Dashboard;
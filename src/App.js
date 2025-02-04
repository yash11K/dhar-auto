import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Typography, Snackbar, Button } from '@mui/material';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TabularView from './components/TabularView';
import './App.css';
import axios from 'axios';
import dayjs from 'dayjs';
import ExportPage from './components/ExportPage';
import { MenuOutlined, ExportOutlined } from '@ant-design/icons';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [pagination, setPagination] = useState({
    limit: 1000,
    offset: 0,
    total: 0,
    dateRange: [dayjs().subtract(30, 'days'), dayjs()]
  });
  const [temperatureStats, setTemperatureStats] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState('dashboard');

  const fetchData = async (newOffset = 0, newLimit = pagination.limit, newDateRange = dateRange) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have valid dayjs objects
      const startDate = dayjs(newDateRange?.[0] || dateRange[0]);
      const endDate = dayjs(newDateRange?.[1] || dateRange[1]);
      
      if (!startDate.isValid() || !endDate.isValid()) {
        throw new Error('Invalid date range');
      }

      const params = {
        startDate: startDate.startOf('day').toISOString(),
        endDate: endDate.endOf('day').toISOString(),
        limit: newLimit,
        offset: newOffset
      };

      console.log('Fetching data with params:', params);
      const response = await axios.get('http://localhost:3001/api/temperature-data', { params });
      console.log('Received response:', response);

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from server');
      }

      const responseData = response.data;
      
      setData(Array.isArray(responseData.data) ? responseData.data : []);
      setPagination({
        limit: newLimit,
        offset: newOffset,
        total: responseData.total || 0,
        dateRange: [startDate, endDate]
      });
      setDateRange([startDate, endDate]);
      setTemperatureStats(responseData.stats || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message);
      setSnackbar({ 
        open: true, 
        message: 'Error fetching data: ' + (error.response?.data?.message || error.message)
      });
      // Set empty data on error
      setData([]);
      setTemperatureStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      setSnackbar({ open: true, message: 'Data refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message);
      setSnackbar({ open: true, message: 'Error refreshing data: ' + error.message });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = async (newOffset, newLimit, newDateRange) => {
    try {
      await fetchData(newOffset, newLimit, newDateRange);
    } catch (error) {
      console.error('Error changing page:', error);
      setSnackbar({
        open: true,
        message: 'Error changing page: ' + error.message
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Define colors for temperature lines with Tailwind-like colors
  const temperatureColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#84CC16', // lime-500
    '#9333EA', // purple-500
    '#64748B', // slate-500
    '#0EA5E9'  // sky-500
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <MenuOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Export Data'
    }
  ];

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'dashboard':
        return (
          <Dashboard
            data={data || []}
            loading={loading}
            pagination={pagination || { limit: 1000, offset: 0, total: 0, dateRange }}
            onPageChange={handlePageChange}
            temperatureStats={temperatureStats}
          />
        );
      case 'export':
        return (
          <ExportPage
            temperatureStats={temperatureStats}
            dateRange={dateRange}
            onDateRangeChange={(newRange) => handlePageChange(0, pagination.limit, newRange)}
          />
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => fetchData()} 
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
        <Header onRefresh={handleRefresh} refreshing={refreshing} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            pt: 10,
            background: '#fff',
            transition: (theme) =>
              theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          }}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                renderContent()
              } 
            />
            <Route 
              path="/table" 
              element={
                <TabularView 
                  data={data || []} 
                  loading={loading}
                  pagination={pagination}
                  onPageChange={(newPage, newPageSize) => fetchData(newPage, newPageSize)}
                  temperatureStats={temperatureStats}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Typography variant="h6">Settings (Coming Soon)</Typography>
              } 
            />
          </Routes>
        </Box>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </Router>
  );
}

export default App;

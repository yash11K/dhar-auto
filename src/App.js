import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Typography, Snackbar, Button } from '@mui/material';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TabularView from './components/TabularView';
import './App.css';
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });
  const [temperatureStats, setTemperatureStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async (page = 1, pageSize = 50, dateRange = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        ...(dateRange && {
          startDate: dateRange[0],
          endDate: dateRange[1]
        })
      };

      console.log('Fetching data with params:', params);
      const { data: response } = await axios.get('/api/temperature-data', { params });
      console.log('Received response:', response);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Response data is not an array');
      }

      if (typeof response.total !== 'number' || 
          typeof response.page !== 'number' || 
          typeof response.pageSize !== 'number' || 
          typeof response.totalPages !== 'number') {
        throw new Error('Missing pagination information in response');
      }

      if (!response.stats || typeof response.stats !== 'object') {
        throw new Error('Missing temperature statistics in response');
      }

      setData(response.data);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
        totalPages: response.totalPages
      });
      setTemperatureStats(response.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message);
      setSnackbar({ 
        open: true, 
        message: 'Error fetching data: ' + (error.response?.data?.message || error.message)
      });
      // Clear data on error
      setData([]);
      setPagination({
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0
      });
      setTemperatureStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post('/api/refresh-cache');
      await fetchData(pagination.page, pagination.pageSize);
      setSnackbar({ open: true, message: 'Data refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message);
      setSnackbar({ open: true, message: 'Error refreshing data: ' + error.message });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Define colors for temperature lines
  const temperatureColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
    '#9b59b6', '#34495e', '#1abc9c', '#e67e22',
    '#95a5a6', '#16a085'
  ];

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
                <Dashboard 
                  data={data || []} 
                  loading={loading} 
                  temperatureColors={temperatureColors}
                  pagination={pagination}
                  onPageChange={(newPage, newPageSize) => fetchData(newPage, newPageSize)}
                  temperatureStats={temperatureStats}
                />
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

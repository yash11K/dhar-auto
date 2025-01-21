import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Typography, Snackbar } from '@mui/material';
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

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/temperature-data');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Error fetching data' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post('/api/refresh-cache');
      await fetchData();
      setSnackbar({ open: true, message: 'Data refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbar({ open: true, message: 'Error refreshing data' });
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

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Header onRefresh={handleRefresh} refreshing={refreshing} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            pt: 10,
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
                  data={data} 
                  loading={loading} 
                  temperatureColors={temperatureColors} 
                />
              } 
            />
            <Route 
              path="/table" 
              element={
                <TabularView 
                  data={data} 
                  loading={loading} 
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

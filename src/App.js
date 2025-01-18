import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Snackbar } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './components/Header';
import TabularView from './components/TabularView';
import './App.css';
import axios from 'axios';

function Dashboard({ data, loading, temperatureColors }) {
  return (
    <Grid container spacing={3}>
      {/* Temperature Graph */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Temperature Trends
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Temperature', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {Array.from({ length: 14 }, (_, i) => (
                <Line
                  key={`T${i + 1}`}
                  type="monotone"
                  dataKey={`T${i + 1}`}
                  stroke={temperatureColors[i]}
                  name={`Zone ${i + 1}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}

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
            pt: 10, // Increased top padding to account for AppBar
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

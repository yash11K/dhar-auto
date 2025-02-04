import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Stack,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DatePicker } from 'antd';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import ThermostatIcon from "@mui/icons-material/Thermostat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function DailyZoneGraph({ temperatureColors }) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedZones, setSelectedZones] = useState(Array.from({ length: 14 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [temperatureStats, setTemperatureStats] = useState(null);
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');

  // Fetch daily data
  const fetchDailyData = async (date) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/temperature-data/daily', {
        params: {
          date: date.toISOString()
        }
      });

      if (response.data) {
        // Format the data to include formatted time
        const formattedData = response.data.data.map(item => ({
          ...item,
          formattedTime: dayjs(item.datetime).format('HH:mm')
        }));
        setData(formattedData);
        setTemperatureStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when selected date changes
  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Render selected zones chips
  const renderSelectedZones = (selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((zoneNum) => (
        <Chip
          key={zoneNum}
          label={`Zone ${zoneNum}`}
          size="small"
          sx={{
            backgroundColor: `${temperatureColors[zoneNum - 1]}20`,
            borderColor: temperatureColors[zoneNum - 1],
            color: temperatureColors[zoneNum - 1],
            '& .MuiChip-label': { fontWeight: 500 },
          }}
        />
      ))}
    </Box>
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #ccc',
          borderRadius: 1,
          p: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ color: entry.color, fontWeight: 500 }}
            >
              {`Zone ${entry.dataKey.slice(1)}: ${entry.value?.toFixed(2)}°C`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Safely get temperature stats with defaults
  const safeStats = {
    min: temperatureStats?.min ?? 0,
    max: temperatureStats?.max ?? 0,
    avg: temperatureStats?.avg ?? 0
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Controls layout */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Date Selection */}
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            style={{ width: '200px' }}
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />

          {/* Zone Selection */}
          <FormControl sx={{ width: '320px' }}>
            <InputLabel>Zones</InputLabel>
            <Select
              multiple
              value={selectedZones}
              onChange={(e) => setSelectedZones(e.target.value)}
              input={<OutlinedInput label="Zones" />}
              renderValue={renderSelectedZones}
              size="small"
            >
              {Array.from({ length: 14 }, (_, i) => (
                <MenuItem 
                  key={i + 1} 
                  value={i + 1}
                  sx={{
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: '#52c41a20 !important',
                      color: '#52c41a',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#52c41a30 !important',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  Zone {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Threshold Controls */}
          <Box sx={{ display: 'flex', gap: 2, width: '300px' }}>
            <TextField
              label="Min Threshold"
              type="number"
              size="small"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              fullWidth
            />
            <TextField
              label="Max Threshold"
              type="number"
              size="small"
              value={maxThreshold}
              onChange={(e) => setMaxThreshold(e.target.value)}
              fullWidth
            />
          </Box>
        </Box>

        {/* Temperature Stats */}
        {temperatureStats && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Temperature Ranges:
            </Typography>
            <Tag color="success">Min: {safeStats.min?.toFixed(2)}°C</Tag>
            <Tag color="processing">Avg: {safeStats.avg?.toFixed(2)}°C</Tag>
            <Tag color="error">Max: {safeStats.max?.toFixed(2)}°C</Tag>
          </Box>
        )}
      </Stack>

      {/* Chart */}
      <Box sx={{ height: 400, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 40, bottom: 45 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              tickMargin={15}
            />
            <YAxis 
              label={{ 
                value: 'Temperature (°C)', 
                angle: -90, 
                position: 'insideLeft',
                offset: -30,
                style: { textAnchor: 'middle' }
              }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {minThreshold && (
              <ReferenceLine 
                y={Number(minThreshold)} 
                stroke="#52c41a"
                strokeDasharray="3 3"
                label={{ 
                  value: `Min: ${minThreshold}°C`,
                  position: 'right',
                  fill: '#52c41a'
                }}
              />
            )}
            {maxThreshold && (
              <ReferenceLine 
                y={Number(maxThreshold)}
                stroke="#f5222d"
                strokeDasharray="3 3"
                label={{ 
                  value: `Max: ${maxThreshold}°C`,
                  position: 'right',
                  fill: '#f5222d'
                }}
              />
            )}
            {selectedZones.map((zoneNum) => (
              <Line
                key={`T${zoneNum}`}
                type="monotone"
                dataKey={`T${zoneNum}`}
                stroke={temperatureColors[zoneNum - 1]}
                name={`Zone ${zoneNum}`}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {(!data || data.length === 0) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              borderRadius: 1,
            }}
          >
            <ThermostatIcon 
              sx={{ 
                fontSize: 48, 
                color: 'text.secondary',
                mb: 2
              }} 
            />
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              No Temperature Data Available
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              No recordings found for {selectedDate.format('MMMM D, YYYY')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleDateChange(dayjs())}
              startIcon={<ArrowBackIcon />}
            >
              Return to Today
            </Button>
          </Box>
        )}
      </Box>

      {/* Data info */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Date: {selectedDate.format('MMMM D, YYYY')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {!data || data.length === 0 
            ? 'No data available for the selected date'
            : `${data.length} temperature recordings`}
        </Typography>
      </Box>
    </Paper>
  );
}

export default DailyZoneGraph; 
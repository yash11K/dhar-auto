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
import { useState, useMemo } from "react";
import { DatePicker } from 'antd';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import ThermostatIcon from "@mui/icons-material/Thermostat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
const { RangePicker } = DatePicker;

function BroaderDashboard({ data, temperatureColors, pagination, onPageChange, temperatureStats }) {
  const [selectedZones, setSelectedZones] = useState(Array.from({ length: 14 }, (_, i) => i + 1));
  const [dateRange, setDateRange] = useState(() => {
    if (pagination.dateRange) {
      return [dayjs(pagination.dateRange[0]), dayjs(pagination.dateRange[1])];
    }
    return [dayjs().subtract(30, 'days'), dayjs()];
  });
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');
  const [aggregationType, setAggregationType] = useState('hourly'); // 'hourly', 'daily', 'weekly'

  const handleDateRangeChange = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      const defaultRange = [dayjs().subtract(30, 'days'), dayjs()];
      setDateRange(defaultRange);
      onPageChange(0, pagination.limit, defaultRange);
      return;
    }
    
    const startDate = dayjs(dates[0]);
    const endDate = dayjs(dates[1]);
    
    if (!startDate.isValid() || !endDate.isValid()) {
      console.error('Invalid date range selected');
      return;
    }
    
    // Automatically adjust aggregation type based on date range
    const daysDiff = endDate.diff(startDate, 'day');
    if (daysDiff > 90) {
      setAggregationType('weekly');
    } else if (daysDiff > 30) {
      setAggregationType('daily');
    } else {
      setAggregationType('hourly');
    }
    
    const newRange = [startDate, endDate];
    setDateRange(newRange);
    onPageChange(0, pagination.limit, newRange);
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

  // Aggregate data based on selected type
  const aggregateData = (data, type) => {
    if (!data || data.length === 0) return [];
    
    const groupedData = {};
    
    data.forEach(item => {
      const date = dayjs(item.datetime);
      let key;
      
      switch (type) {
        case 'weekly':
          key = date.startOf('week').format('YYYY-MM-DD');
          break;
        case 'daily':
          key = date.startOf('day').format('YYYY-MM-DD');
          break;
        case 'hourly':
        default:
          key = date.format('YYYY-MM-DD HH:00');
          break;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          datetime: key,
          formattedDate: type === 'weekly' 
            ? `Week of ${dayjs(key).format('MMM D')}`
            : type === 'daily'
              ? dayjs(key).format('MMM D')
              : dayjs(key).format('MMM D, HH:mm'),
          counts: {},
          sums: {},
          mins: {},
          maxs: {},
        };
        
        // Initialize for all zones
        for (let i = 1; i <= 14; i++) {
          groupedData[key].counts[`T${i}`] = 0;
          groupedData[key].sums[`T${i}`] = 0;
          groupedData[key].mins[`T${i}`] = Infinity;
          groupedData[key].maxs[`T${i}`] = -Infinity;
        }
      }
      
      // Process each temperature zone
      for (let i = 1; i <= 14; i++) {
        const temp = item[`T${i}`];
        if (temp !== null && temp !== undefined) {
          groupedData[key].counts[`T${i}`]++;
          groupedData[key].sums[`T${i}`] += temp;
          groupedData[key].mins[`T${i}`] = Math.min(groupedData[key].mins[`T${i}`], temp);
          groupedData[key].maxs[`T${i}`] = Math.max(groupedData[key].maxs[`T${i}`], temp);
        }
      }
    });
    
    // Calculate averages and format final data
    return Object.values(groupedData).map(group => {
      const result = {
        datetime: group.datetime,
        formattedDate: group.formattedDate,
      };
      
      for (let i = 1; i <= 14; i++) {
        const zoneKey = `T${i}`;
        if (group.counts[zoneKey] > 0) {
          result[zoneKey] = group.sums[zoneKey] / group.counts[zoneKey];
          result[`${zoneKey}_min`] = group.mins[zoneKey];
          result[`${zoneKey}_max`] = group.maxs[zoneKey];
        } else {
          result[zoneKey] = null;
          result[`${zoneKey}_min`] = null;
          result[`${zoneKey}_max`] = null;
        }
      }
      
      return result;
    }).sort((a, b) => dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf());
  };

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return aggregateData(data, aggregationType);
  }, [data, aggregationType]);

  // Custom tooltip to show min/max/avg
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
        {payload.map((entry, index) => {
          const zoneKey = entry.dataKey;
          if (!zoneKey.includes('_min') && !zoneKey.includes('_max')) {
            const minValue = payload.find(p => p.dataKey === `${zoneKey}_min`)?.value;
            const maxValue = payload.find(p => p.dataKey === `${zoneKey}_max`)?.value;
            
            return (
              <Box key={index} sx={{ mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: entry.color, fontWeight: 500 }}
                >
                  {`Zone ${zoneKey.slice(1)}`}
                </Typography>
                <Typography variant="caption" display="block">
                  {`Avg: ${entry.value?.toFixed(2)}°C`}
                </Typography>
                {minValue && maxValue && (
                  <Typography variant="caption" display="block">
                    {`Range: ${minValue.toFixed(2)}°C - ${maxValue.toFixed(2)}°C`}
                  </Typography>
                )}
              </Box>
            );
          }
          return null;
        })}
      </Box>
    );
  };

  // Custom legend renderer with clickable zones
  const renderLegend = (props) => {
    const { payload } = props;
    
    const handleSelectAll = () => {
      setSelectedZones(Array.from({ length: 14 }, (_, i) => i + 1));
    };

    const handleSelectNone = () => {
      setSelectedZones([]);
    };
    
    return (
      <Box sx={{ width: '100%', px: 2, py: 1 }}>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 1,
            mb: 2
          }}
        >
          {payload
            .filter(entry => !entry.dataKey.includes('_min') && !entry.dataKey.includes('_max'))
            .map((entry, index) => (
              <Box
                key={`legend-${index}`}
                onClick={() => {
                  const zoneNum = parseInt(entry.value.split(' ')[1]);
                  setSelectedZones(prev => 
                    prev.includes(zoneNum) 
                      ? prev.filter(z => z !== zoneNum)
                      : [...prev, zoneNum]
                  );
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  backgroundColor: selectedZones.includes(parseInt(entry.value.split(' ')[1]))
                    ? 'rgba(0, 0, 0, 0.08)'
                    : 'transparent',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 2,
                    backgroundColor: entry.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" noWrap>
                  {entry.value}
                </Typography>
              </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button 
            size="small" 
            onClick={handleSelectAll} 
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Select All
          </Button>
          <Button 
            size="small" 
            onClick={handleSelectNone} 
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Clear All
          </Button>
        </Box>
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

          {/* Date Range Picker */}
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear={false}
            style={{ width: '320px' }}
            ranges={{
              'Last 7 Days': [dayjs().subtract(6, 'days'), dayjs()],
              'Last 14 Days': [dayjs().subtract(13, 'days'), dayjs()],
              'Last 30 Days': [dayjs().subtract(29, 'days'), dayjs()],
              'Last 90 Days': [dayjs().subtract(89, 'days'), dayjs()],
            }}
            disabledDate={(current) => {
              return current && current > dayjs().endOf('day');
            }}
          />

          {/* Aggregation Type */}
          <FormControl sx={{ width: '150px' }}>
            <InputLabel>View By</InputLabel>
            <Select
              value={aggregationType}
              onChange={(e) => setAggregationType(e.target.value)}
              size="small"
              label="View By"
            >
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
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

        {/* Temperature Range Legend */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Temperature Ranges:
          </Typography>
          {!data || data.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No data available for the selected date range
            </Typography>
          ) : (
            <>
              <Tag color="success">Low: {safeStats.min.toFixed(2)}°C</Tag>
              <Tag color="processing">Avg: {safeStats.avg.toFixed(2)}°C</Tag>
              <Tag color="error">High: {safeStats.max.toFixed(2)}°C</Tag>
            </>
          )}
        </Box>
      </Stack>

      {/* Chart */}
      <Box sx={{ height: 400, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 40, bottom: 45 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
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
            <Legend content={renderLegend} />
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
                connectNulls={false}
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
              No recordings found between {dateRange[0].format('MMMM D, YYYY')} and {dateRange[1].format('MMMM D, YYYY')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleDateRangeChange([dayjs().subtract(30, 'days'), dayjs()])}
              startIcon={<ArrowBackIcon />}
            >
              Return to Last 30 Days
            </Button>
          </Box>
        )}
      </Box>

      {/* Data info */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Date Range: {dateRange[0].format('MMMM D, YYYY')} - {dateRange[1].format('MMMM D, YYYY')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View Mode: {aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)} Aggregation
        </Typography>
      </Box>
    </Paper>
  );
}

export default BroaderDashboard; 
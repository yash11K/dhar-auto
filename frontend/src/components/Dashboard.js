import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Modal,
  Chip,
  TextField,
  InputLabel,
  OutlinedInput,
  Stack,
  Button,
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
  Brush,
  ReferenceLine,
} from "recharts";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useMemo } from "react";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Tag } from 'antd';
import 'antd/dist/reset.css';
import { DatePicker } from 'antd';
import { Pagination } from 'antd';
import DataVisualizations from './DataVisualizations';
import DailyZoneGraph from './DailyZoneGraph';
import BroaderDashboard from './BroaderDashboard';
const { RangePicker } = DatePicker;
dayjs.extend(isBetween);

// Temperature range utility - match with TabularView
export const getTemperatureRanges = (data) => {
  const allTemps = [];
  for (let i = 1; i <= 14; i++) {
    const zoneTemps = data
      .map(row => row[`T${i}`])
      .filter(temp => temp != null && !isNaN(temp));
    allTemps.push(...zoneTemps);
  }

  allTemps.sort((a, b) => a - b);
  
  const getPercentile = (arr, percentile) => {
    const index = Math.ceil(arr.length * percentile) - 1;
    return arr[index];
  };

  return {
    min: Math.min(...allTemps),
    max: Math.max(...allTemps),
    q1: getPercentile(allTemps, 0.25),
    q3: getPercentile(allTemps, 0.75),
    median: getPercentile(allTemps, 0.5)
  };
};

// Temperature color utility - match with TabularView
export const getTemperatureColor = (value, ranges) => {
  if (!ranges || value === null || value === undefined) return 'inherit';
  if (value <= ranges.q1) return '#52c41a'; // green
  if (value >= ranges.q3) return '#f5222d'; // red
  return '#1890ff'; // blue
};

function ConfigurableGraph({ data, temperatureColors, pagination, onPageChange, temperatureStats }) {
  const [selectedZones, setSelectedZones] = useState(Array.from({ length: 14 }, (_, i) => i + 1));
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');

  const handleDateRangeChange = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      const defaultRange = [dayjs().subtract(30, 'days'), dayjs()];
      setDateRange(defaultRange);
      onPageChange(0, pagination.limit, defaultRange);
      return;
    }
    
    // Ensure we have valid dayjs objects
    const startDate = dayjs(dates[0]);
    const endDate = dayjs(dates[1]);
    
    if (!startDate.isValid() || !endDate.isValid()) {
      console.error('Invalid date range selected');
      return;
    }
    
    const newRange = [startDate, endDate];
    setDateRange(newRange);
    onPageChange(0, pagination.limit, newRange);
  };

  // Add renderSelectedZones function
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
            '& .MuiChip-label': {
              fontWeight: 500,
            },
          }}
        />
      ))}
    </Box>
  );

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Return empty data points for visualization
      const days = dateRange[1].diff(dateRange[0], 'day') + 1;
      return Array.from({ length: days }, (_, i) => ({
        datetime: dayjs(dateRange[0]).add(i, 'day').toISOString(),
        formattedDate: dayjs(dateRange[0]).add(i, 'day').format('DD/MM/YYYY'),
        ...Array.from({ length: 14 }, (_, j) => ({ [`T${j + 1}`]: null })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
      }));
    }

    return data.map(item => ({
      ...item,
      formattedDate: dayjs(item.datetime).format('DD/MM/YYYY'),
      formattedTime: dayjs(item.datetime).format('HH:mm:ss')
    }));
  }, [data, dateRange]);

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
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Button 
            size="small" 
            onClick={handleSelectAll}
            variant="outlined"
          >
            Select All
          </Button>
          <Button 
            size="small" 
            onClick={handleSelectNone}
            variant="outlined"
          >
            Clear All
          </Button>
        </Box>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 1,
          }}
        >
          {payload.map((entry, index) => (
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
                    '&::after': {
                      bgcolor: temperatureColors[i],
                    },
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
            }}
            disabledDate={(current) => {
              // Can't select days after today
              return current && current > dayjs().endOf('day');
            }}
          />

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
            <Tooltip 
              labelFormatter={(label) => label}
              formatter={(value) => value ? [`${Number(value).toFixed(2)}°C`] : ['No data']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
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
        {data.length === 0 && (
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
          {!data || data.length === 0 
            ? 'No data available for the selected date range'
            : `${data.length} temperature recordings`}
        </Typography>
      </Box>
    </Paper>
  );
}

function DetailedGraphView({ open, onClose, zoneNumber, data, color }) {
  const [timeRange, setTimeRange] = useState("all");

  const getFilteredData = () => {
    switch (timeRange) {
      case "day":
        return data.slice(-24);
      case "week":
        return data.slice(-168);
      case "month":
        return data.slice(-720);
      default:
        return data;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        sx={{
          width: "95%",
          maxWidth: 1200,
          height: "80vh",
          p: 3,
          position: "relative",
          outline: "none",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FormControl size="small">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Data</MenuItem>
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ height: "calc(100% - 60px)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={getFilteredData()}
              margin={{ top: 5, right: 5, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                label={{
                  value: "Temperature (°C)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: `1px solid ${color}`,
                  borderRadius: "4px",
                }}
                labelStyle={{ color: "text.primary", fontWeight: "bold" }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: color }}
              />
              <Brush dataKey="time" height={30} stroke={color} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Modal>
  );
}

function ZoneCard({ zoneNumber, data, color, temperatureStats }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Process zone data
  const zoneData = data
    .map((item) => ({
      time: item.time,
      temperature: item[`T${zoneNumber}`],
    }))
    .filter((item) => item.temperature != null);

  const currentTemp =
    zoneData.length > 0 ? zoneData[zoneData.length - 1].temperature : 0;
  const avgTemp =
    zoneData.reduce((sum, item) => sum + item.temperature, 0) /
    (zoneData.length || 1);
  const maxTemp = Math.max(...zoneData.map((item) => item.temperature), 0);
  const minTemp = Math.min(...zoneData.map((item) => item.temperature), 0);

  // Get last 5 readings for preview
  const previewData = zoneData.slice(-5);

  const handleBackClick = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  return (
    <>
      <Box
        sx={{
          perspective: "1000px",
          height: "100%",
          minHeight: 300, // Reduced height
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.6s",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side */}
          <Card
            onClick={() => setIsFlipped(true)}
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              cursor: "pointer",
              "&:hover": {
                boxShadow: 6,
                "& .preview-overlay": {
                  opacity: 1,
                },
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ThermostatIcon sx={{ color, mr: 1 }} />
                <Typography variant="h6">Zone {zoneNumber}</Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ color, mb: 2, textAlign: "center" }}
              >
                {currentTemp.toFixed(1)}°C
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Avg
                  </Typography>
                  <Typography variant="body1">
                    {avgTemp.toFixed(1)}°C
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Max
                  </Typography>
                  <Typography variant="body1">
                    {maxTemp.toFixed(1)}°C
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Min
                  </Typography>
                  <Typography variant="body1">
                    {minTemp.toFixed(1)}°C
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Back Side */}
          <Card
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ height: "100%", p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Zone {zoneNumber} Temperature
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailedView(true);
                  }}
                  size="small"
                >
                  <OpenInFullIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: "calc(100% - 60px)", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={zoneData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: `1px solid ${color}`,
                        borderRadius: "4px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

              {/* Back Button */}
              <IconButton
                onClick={handleBackClick}
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  backgroundColor: "background.paper",
                  boxShadow: 2,
                  "&:hover": {
                    backgroundColor: "background.paper",
                    boxShadow: 4,
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <DetailedGraphView
        open={showDetailedView}
        onClose={() => setShowDetailedView(false)}
        zoneNumber={zoneNumber}
        data={zoneData}
        color={color}
      />
    </>
  );
}

function Dashboard({ data = [], loading = false, pagination = {}, onPageChange, temperatureStats = null }) {
  // Default temperature colors
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading temperature data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Monthly Overview */}
      <Typography variant="h6" sx={{ mb: 2 }}>Temperature Overview</Typography>
      <BroaderDashboard 
        data={data} 
        temperatureColors={temperatureColors}
        pagination={pagination}
        onPageChange={onPageChange}
        temperatureStats={temperatureStats}
      />

      {/* Daily View */}
      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Daily Temperature View</Typography>
      <DailyZoneGraph 
        data={data} 
        temperatureColors={temperatureColors}
        pagination={pagination}
        onPageChange={onPageChange}
        temperatureStats={temperatureStats}
      />


      {/* Zone Overview */}
      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Zone Overview</Typography>
      <Grid container spacing={3}>
        {Array.from({ length: 14 }, (_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <ZoneCard
              zoneNumber={i + 1}
              data={data}
              color={temperatureColors[i]}
              temperatureStats={temperatureStats}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard; 
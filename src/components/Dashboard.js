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
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useMemo } from "react";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Tag } from 'antd';
import 'antd/dist/reset.css';
import { DatePicker } from 'antd';
import { Pagination } from 'antd';
import DataVisualizations from './DataVisualizations';
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
  const [dateRange, setDateRange] = useState(null);
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');

  const handleZoneChange = (event) => {
    const { value } = event.target;
    setSelectedZones(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates) {
      onPageChange(1, pagination.pageSize, dates.map(date => date.format('YYYY-MM-DD')));
    } else {
      onPageChange(1, pagination.pageSize);
    }
  };

  // Process data for the chart
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: dayjs(item.date).format('DD/MM/YYYY'),
      formattedTime: item.time
    }));
  }, [data]);

  console.log('Chart data sample:', chartData[0]); // Debug log

  // Function to render selected zones with limit
  const renderSelectedZones = (selected) => {
    const maxDisplay = 3;
    const displayedZones = selected.slice(0, maxDisplay);
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {displayedZones.map((value) => (
          <Chip 
            key={value} 
            label={`Zone ${value}`} 
            size="small"
            sx={{ 
              bgcolor: temperatureColors[value - 1],
              color: '#fff',
              '& .MuiChip-deleteIcon': {
                color: '#fff',
                '&:hover': {
                  opacity: 0.7,
                },
              },
            }}
          />
        ))}
        {selected.length > maxDisplay && (
          <Chip 
            label={`+${selected.length - maxDisplay} more`} 
            size="small"
            sx={{ 
              bgcolor: 'grey.300',
              color: 'text.primary',
            }}
          />
        )}
      </Box>
    );
  };

  // Custom legend renderer
  const renderLegend = (props) => {
    const { payload } = props;
    
    return (
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 1,
          width: '100%',
          px: 2,
          py: 1,
        }}
      >
        {payload.map((entry, index) => (
          <Box
            key={`legend-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.875rem',
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
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Controls layout */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Zone Selection */}
          <FormControl sx={{ width: '320px' }}>
            <InputLabel>Zones</InputLabel>
            <Select
              multiple
              value={selectedZones}
              onChange={handleZoneChange}
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
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear
            style={{ width: '320px' }}
            placeholder={['Start Date', 'End Date']}
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
        {temperatureStats && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Temperature Ranges:
            </Typography>
            <Tag color="success">Low: ≤{temperatureStats.q1.toFixed(2)}°C</Tag>
            <Tag color="processing">Normal: {temperatureStats.q1.toFixed(2)}-{temperatureStats.q3.toFixed(2)}°C</Tag>
            <Tag color="error">High: ≥{temperatureStats.q3.toFixed(2)}°C</Tag>
          </Box>
        )}
      </Stack>

      {/* Chart */}
      <Box sx={{ height: 400, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
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
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              labelFormatter={(label) => label}
              formatter={(value) => [value ? `${value.toFixed(2)}°C` : 'N/A']}
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
                label={{ value: 'Min Threshold', position: 'insideLeft' }} 
              />
            )}
            {maxThreshold && (
              <ReferenceLine 
                y={Number(maxThreshold)} 
                stroke="#f5222d"
                strokeDasharray="3 3" 
                label={{ value: 'Max Threshold', position: 'insideRight' }} 
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
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={pagination.page}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={(page, pageSize) => onPageChange(page, pageSize)}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `Total ${total} items`}
        />
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
          <Typography variant="h5">
            Zone {zoneNumber} Temperature Analysis
          </Typography>
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

function Dashboard({ data, loading, temperatureColors, pagination, onPageChange, temperatureStats }) {
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading temperature data...</Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No temperature data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ConfigurableGraph 
        data={data} 
        temperatureColors={temperatureColors}
        pagination={pagination}
        onPageChange={onPageChange}
        temperatureStats={temperatureStats}
      />

      <DataVisualizations 
        data={data}
        temperatureStats={temperatureStats}
        temperatureColors={temperatureColors}
      />

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
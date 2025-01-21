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
  AreaChart,
  Area,
} from "recharts";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

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

function ZoneCard({ zoneNumber, data, color }) {
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

function Dashboard({ data, loading, temperatureColors }) {
  return (
    <Box>
      {/* Zone Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 14 }, (_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <ZoneStatCard
              zoneNumber={i + 1}
              data={data}
              color={temperatureColors[i]}
            />
          </Grid>
        ))}
      </Grid>

      {/* Temperature Graph */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 500 }}>
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
                <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                {Array.from({ length: 14 }, (_, i) => (
                  <Line
                    key={`T${i + 1}`}
                    type="monotone"
                    dataKey={`T${i + 1}`}
                    stroke={temperatureColors[i]}
                    name={`Zone ${i + 1}`}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 
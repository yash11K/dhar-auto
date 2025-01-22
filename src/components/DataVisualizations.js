import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Scatter,
    ScatterChart,
    HeatMapSeries,
    HeatMap,
    AreaChart,
    Area
} from 'recharts';
import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import { scaleLinear } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';

const DataVisualizations = ({ data, temperatureStats, temperatureColors }) => {
    // Process data for heatmap
    const heatmapData = useMemo(() => {
        return data.map(row => {
            const temperatures = [];
            for (let i = 1; i <= 14; i++) {
                temperatures.push({
                    zone: `T${i}`,
                    value: row[`T${i}`] || 0
                });
            }
            return {
                time: row.formattedTime,
                temperatures
            };
        });
    }, [data]);

    // Calculate temperature distributions
    const distributions = useMemo(() => {
        const ranges = {
            low: [],
            normal: [],
            high: []
        };

        for (let i = 1; i <= 14; i++) {
            const zoneTemps = data
                .map(row => row[`T${i}`])
                .filter(temp => temp != null);

            ranges.low.push(zoneTemps.filter(t => t <= temperatureStats.q1).length);
            ranges.normal.push(zoneTemps.filter(t => t > temperatureStats.q1 && t < temperatureStats.q3).length);
            ranges.high.push(zoneTemps.filter(t => t >= temperatureStats.q3).length);
        }

        return ranges;
    }, [data, temperatureStats]);

    // Calculate zone correlations
    const correlations = useMemo(() => {
        const correlationData = [];
        for (let i = 1; i <= 14; i++) {
            for (let j = i + 1; j <= 14; j++) {
                const zone1Data = data.map(row => row[`T${i}`]).filter(t => t != null);
                const zone2Data = data.map(row => row[`T${j}`]).filter(t => t != null);
                
                // Calculate correlation coefficient
                const n = Math.min(zone1Data.length, zone2Data.length);
                if (n < 2) continue;

                const sum1 = zone1Data.reduce((a, b) => a + b, 0);
                const sum2 = zone2Data.reduce((a, b) => a + b, 0);
                const mean1 = sum1 / n;
                const mean2 = sum2 / n;

                let numerator = 0;
                let denom1 = 0;
                let denom2 = 0;

                for (let k = 0; k < n; k++) {
                    numerator += (zone1Data[k] - mean1) * (zone2Data[k] - mean2);
                    denom1 += Math.pow(zone1Data[k] - mean1, 2);
                    denom2 += Math.pow(zone2Data[k] - mean2, 2);
                }

                const correlation = numerator / Math.sqrt(denom1 * denom2);
                
                correlationData.push({
                    zone1: `T${i}`,
                    zone2: `T${j}`,
                    correlation: correlation
                });
            }
        }
        return correlationData;
    }, [data]);

    // Calculate time-based patterns
    const timePatterns = useMemo(() => {
        const patterns = [];
        const hourlyAverages = new Array(24).fill(0).map(() => ({
            count: 0,
            sum: new Array(14).fill(0)
        }));

        data.forEach(row => {
            if (row.time) {
                const hour = new Date(`1970-01-01T${row.time}`).getHours();
                hourlyAverages[hour].count++;
                for (let i = 1; i <= 14; i++) {
                    if (row[`T${i}`] != null) {
                        hourlyAverages[hour].sum[i-1] += row[`T${i}`];
                    }
                }
            }
        });

        for (let hour = 0; hour < 24; hour++) {
            if (hourlyAverages[hour].count > 0) {
                patterns.push({
                    hour: `${hour}:00`,
                    ...hourlyAverages[hour].sum.reduce((acc, sum, idx) => ({
                        ...acc,
                        [`T${idx + 1}`]: sum / hourlyAverages[hour].count
                    }), {})
                });
            }
        }

        return patterns;
    }, [data]);

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Temperature Distribution */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Temperature Distribution Across Zones
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={Array.from({ length: 14 }, (_, i) => ({
                                    zone: `T${i + 1}`,
                                    low: distributions.low[i],
                                    normal: distributions.normal[i],
                                    high: distributions.high[i]
                                }))}
                                stackOffset="expand"
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="zone" />
                                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                <Legend />
                                <Area type="monotone" dataKey="low" stackId="1" stroke="#52c41a" fill="#52c41a" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="normal" stackId="1" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="high" stackId="1" stroke="#f5222d" fill="#f5222d" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Zone Correlation Matrix */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Zone Temperature Correlations
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="zone1" 
                                    type="category"
                                    allowDuplicatedCategory={false}
                                />
                                <YAxis 
                                    dataKey="zone2"
                                    type="category"
                                    allowDuplicatedCategory={false}
                                />
                                <Tooltip 
                                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Correlation']}
                                />
                                <Scatter
                                    data={correlations}
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Time-based Pattern Analysis */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Hourly Temperature Patterns
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={timePatterns}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {Array.from({ length: 14 }, (_, i) => (
                                    <Line
                                        key={`T${i + 1}`}
                                        type="monotone"
                                        dataKey={`T${i + 1}`}
                                        stroke={temperatureColors[i]}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DataVisualizations; 
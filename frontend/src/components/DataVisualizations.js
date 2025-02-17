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
    ScatterChart,
    Scatter,
    AreaChart,
    Area
} from 'recharts';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

const DataVisualizations = ({ data, temperatureStats, temperatureColors }) => {
    // Process data for time series
    const timeSeriesData = useMemo(() => {
        return data.map(row => ({
            datetime: dayjs(row.datetime).format('HH:mm:ss'),
            ...Object.fromEntries(
                Array.from({ length: 14 }, (_, i) => [`T${i + 1}`, row[`T${i + 1}`]])
            )
        }));
    }, [data]);

    // Calculate zone correlations
    const correlationData = useMemo(() => {
        const correlations = [];
        for (let i = 1; i <= 14; i++) {
            for (let j = i + 1; j <= 14; j++) {
                const zone1Data = data.map(row => row[`T${i}`]).filter(t => t != null);
                const zone2Data = data.map(row => row[`T${j}`]).filter(t => t != null);
                
                if (zone1Data.length < 2 || zone2Data.length < 2) continue;

                // Calculate correlation coefficient
                const n = Math.min(zone1Data.length, zone2Data.length);
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
                
                correlations.push({
                    x: mean1,
                    y: mean2,
                    z: Math.abs(correlation) * 100,
                    name: `Zone ${i} vs Zone ${j}`,
                    correlation
                });
            }
        }
        return correlations;
    }, [data]);

    // Calculate hourly patterns
    const hourlyPatterns = useMemo(() => {
        const patterns = new Array(24).fill(0).map(() => ({
            hour: 0,
            readings: Array(14).fill({ sum: 0, count: 0 })
        }));

        data.forEach(row => {
            const hour = dayjs(row.datetime).hour();
            patterns[hour].hour = hour;
            
            for (let i = 1; i <= 14; i++) {
                if (row[`T${i}`] != null) {
                    patterns[hour].readings[i-1].sum += row[`T${i}`];
                    patterns[hour].readings[i-1].count++;
                }
            }
        });

        return patterns.map(({ hour, readings }) => ({
            hour: `${hour}:00`,
            ...readings.reduce((acc, { sum, count }, idx) => ({
                ...acc,
                [`T${idx + 1}`]: count > 0 ? sum / count : null
            }), {})
        }));
    }, [data]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const chartVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.5, delay: 0.2 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Grid container spacing={3}>
                {/* Time Series Chart */}
                <Grid item xs={12}>
                    <Paper 
                        elevation={2}
                        className="rounded-lg overflow-hidden"
                        sx={{ p: 3, background: 'linear-gradient(to right, #ffffff, #f8f9fa)' }}
                    >
                        <motion.div variants={chartVariants}>
                            <Typography variant="h6" gutterBottom className="font-semibold">
                                Temperature Time Series
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer>
                                    <LineChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis 
                                            dataKey="datetime"
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <YAxis 
                                            label={{ 
                                                value: 'Temperature (°C)', 
                                                angle: -90, 
                                                position: 'insideLeft',
                                                style: { fill: '#666' }
                                            }}
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Legend />
                                        {Array.from({ length: 14 }, (_, i) => (
                                            <Line
                                                key={`T${i + 1}`}
                                                type="monotone"
                                                dataKey={`T${i + 1}`}
                                                stroke={temperatureColors[i]}
                                                dot={false}
                                                strokeWidth={2}
                                                name={`Zone ${i + 1}`}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Paper>
                </Grid>

                {/* Correlation Scatter Plot */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2}
                        className="rounded-lg overflow-hidden"
                        sx={{ p: 3, background: 'linear-gradient(to right, #ffffff, #f8f9fa)' }}
                    >
                        <motion.div variants={chartVariants}>
                            <Typography variant="h6" gutterBottom className="font-semibold">
                                Zone Temperature Correlations
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer>
                                    <ScatterChart>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis 
                                            type="number"
                                            dataKey="x"
                                            name="Temperature Zone 1"
                                            label={{ value: 'Temperature Zone 1 (°C)', position: 'bottom' }}
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <YAxis 
                                            type="number"
                                            dataKey="y"
                                            name="Temperature Zone 2"
                                            label={{ value: 'Temperature Zone 2 (°C)', angle: -90, position: 'left' }}
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <Tooltip 
                                            cursor={{ strokeDasharray: '3 3' }}
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                            formatter={(value, name, props) => {
                                                if (name === 'correlation') {
                                                    return [`${props.payload.correlation.toFixed(2)}`, 'Correlation'];
                                                }
                                                return [value.toFixed(2), name];
                                            }}
                                        />
                                        <Scatter
                                            data={correlationData}
                                            fill="#8884d8"
                                            fillOpacity={0.6}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Paper>
                </Grid>

                {/* Hourly Patterns */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2}
                        className="rounded-lg overflow-hidden"
                        sx={{ p: 3, background: 'linear-gradient(to right, #ffffff, #f8f9fa)' }}
                    >
                        <motion.div variants={chartVariants}>
                            <Typography variant="h6" gutterBottom className="font-semibold">
                                Hourly Temperature Patterns
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={hourlyPatterns}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis 
                                            dataKey="hour"
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <YAxis 
                                            label={{ 
                                                value: 'Temperature (°C)', 
                                                angle: -90, 
                                                position: 'insideLeft',
                                                style: { fill: '#666' }
                                            }}
                                            tick={{ fill: '#666' }}
                                            stroke="#666"
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Legend />
                                        {Array.from({ length: 14 }, (_, i) => (
                                            <Area
                                                key={`T${i + 1}`}
                                                type="monotone"
                                                dataKey={`T${i + 1}`}
                                                stroke={temperatureColors[i]}
                                                fill={temperatureColors[i]}
                                                fillOpacity={0.1}
                                                strokeWidth={2}
                                                name={`Zone ${i + 1}`}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );
};

export default DataVisualizations; 
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(2px)',
        zIndex: 1,
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
        {data === null 
          ? 'Loading temperature data...' 
          : `No recordings found for ${selectedDate.format('MMMM D, YYYY')}`}
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
    Selected Date: {selectedDate.format('MMMM D, YYYY')}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    {data && data.length > 0 
      ? `${data.length} temperature recordings`
      : 'No recordings available'}
  </Typography>
</Box> 
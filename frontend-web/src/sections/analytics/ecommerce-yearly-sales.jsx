import { useState, useCallback, useEffect } from "react";

import Card from "@mui/material/Card";
import { useTheme } from "@mui/material/styles";
import CardHeader from "@mui/material/CardHeader";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";

import { fShortenNumber } from "src/utils/format-number";
import { Iconify } from "src/components/iconify";

import {
  Chart,
  useChart,
  ChartSelect,
  ChartLegends,
} from "src/components/chart";

// ----------------------------------------------------------------------

export function EcommerceYearlySales({
  title,
  subheader,
  chart,
  sx,
  periodData,
  onDateChange,
  loading,
  initialPeriod = "monthly",
  initialDate,
  ...other
}) {
  const theme = useTheme();

  const [selectedSeries, setSelectedSeries] = useState(
    chart.series?.[0]?.name || "2023"
  );
  const [period, setPeriod] = useState(initialPeriod);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.main,
  ];

  const handleChangeSeries = useCallback((newValue) => {
    setSelectedSeries(newValue);
  }, []);

  const handlePeriodChange = useCallback(
    (event, newPeriod) => {
      if (newPeriod !== null) {
        setPeriod(newPeriod);
        const today = new Date();
        setSelectedDate(today);
        // Fetch data for the new period
        if (newPeriod !== "monthly" && onDateChange) {
          onDateChange(today, newPeriod);
        }
      }
    },
    [onDateChange]
  );

  const handleDateChange = useCallback(
    (event) => {
      const newDate = new Date(event.target.value);
      if (newDate && !isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
        if (onDateChange) {
          onDateChange(newDate, period);
        }
      }
    },
    [period, onDateChange]
  );

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePrevious = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (period === "weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (period === "daily") {
      newDate.setDate(newDate.getDate() - 1);
    }
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate, period);
    }
  }, [selectedDate, period, onDateChange]);

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (period === "daily") {
      newDate.setDate(newDate.getDate() + 1);
    }

    // Don't go beyond today
    if (newDate <= today) {
      setSelectedDate(newDate);
      if (onDateChange) {
        onDateChange(newDate, period);
      }
    }
  }, [selectedDate, period, onDateChange]);

  // Determine chart data based on selected period
  let currentCategories = chart.categories;
  let currentSeries =
    chart.series.find((i) => i.name === selectedSeries) || chart.series[0];

  console.log("Period:", period);
  console.log("Period Data:", periodData);
  console.log("Chart series:", chart.series);

  if (period === "monthly" && chart.series && chart.series.length > 0) {
    // 월별 데이터는 chart.series에서 가져옴
    currentSeries =
      chart.series.find((i) => i.name === selectedSeries) || chart.series[0];
  } else if (period === "weekly" && periodData?.weeklyRevenue) {
    console.log("Weekly Revenue Data:", periodData.weeklyRevenue);
    currentCategories = periodData.weeklyRevenue.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    currentSeries = {
      name: "최근 7일",
      data: [
        {
          name: "매출 (만원)",
          data: periodData.weeklyRevenue.map((item) =>
            Math.round((item.revenue || 0) / 10000)
          ),
          yAxisIndex: 0,
        },
        {
          name: "주문 수",
          data: periodData.weeklyRevenue.map((item) => item.orders || 0),
          yAxisIndex: 1,
        },
      ],
    };
  } else if (period === "daily" && periodData?.dailyRevenue) {
    console.log("Daily Revenue Data:", periodData.dailyRevenue);
    currentCategories = periodData.dailyRevenue.map((item) => `${item.hour}시`);
    currentSeries = {
      name: "최근 24시간",
      data: [
        {
          name: "매출 (만원)",
          data: periodData.dailyRevenue.map((item) =>
            Math.round((item.revenue || 0) / 10000)
          ),
          yAxisIndex: 0,
        },
        {
          name: "주문 수",
          data: periodData.dailyRevenue.map((item) => item.orders || 0),
          yAxisIndex: 1,
        },
      ],
    };
  }

  const baseOptions = {
    colors: chartColors,
    xaxis: { categories: currentCategories },
    yaxis: [
      {
        title: {
          text: period === "monthly" ? "매출 (백만원)" : "매출 (만원)",
        },
        labels: {
          formatter: (val) => Math.round(val),
        },
      },
      {
        opposite: true,
        title: {
          text: "주문 수",
        },
        labels: {
          formatter: (val) => Math.round(val),
        },
      },
    ],
  };

  // Merge with chart.options, but let our yaxis override
  const chartOptions = useChart({
    ...chart.options,
    ...baseOptions,
  });

  const isToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime();
  };

  return (
    <Card sx={sx} {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
            >
              <ToggleButton value="monthly">월별</ToggleButton>
              <ToggleButton value="weekly">주별</ToggleButton>
              <ToggleButton value="daily">시간별</ToggleButton>
            </ToggleButtonGroup>
            {period === "monthly" && (
              <ChartSelect
                options={chart.series.map((item) => item.name)}
                value={selectedSeries}
                onChange={handleChangeSeries}
              />
            )}
            {period !== "monthly" && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <IconButton size="small" onClick={handlePrevious}>
                  <Iconify icon="eva:arrow-ios-back-fill" />
                </IconButton>
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateChange}
                  inputProps={{
                    max: formatDateForInput(new Date()),
                  }}
                  sx={{ width: 150 }}
                />
                <IconButton
                  size="small"
                  onClick={handleNext}
                  disabled={isToday()}
                >
                  <Iconify icon="eva:arrow-ios-forward-fill" />
                </IconButton>
              </Box>
            )}
          </Box>
        }
        sx={{ mb: 3 }}
      />

      {currentSeries?.data && (
        <ChartLegends
          colors={chartOptions?.colors}
          labels={currentSeries.data.map((item) => item.name)}
          values={currentSeries.data.map((item) => {
            const total = item.data.reduce(
              (sum, value) => sum + (value || 0),
              0
            );
            return fShortenNumber(total);
          })}
          sx={{ px: 3, gap: 3 }}
        />
      )}

      {currentSeries?.data && (
        <Chart
          type="area"
          series={currentSeries.data}
          options={chartOptions}
          slotProps={{ loading: { p: 2.5 } }}
          sx={{
            pl: 1,
            py: 2.5,
            pr: 2.5,
            height: 320,
          }}
        />
      )}
    </Card>
  );
}

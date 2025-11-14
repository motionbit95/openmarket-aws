import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Iconify } from "src/components/iconify";

export default function AdminStatCard({ title, value, icon, color = "primary", trend }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette[color].light} 0%, ${theme.palette[color].main} 100%)`,
        color: "white",
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>
              {value}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <Iconify
                  icon={trend > 0 ? "eva:trending-up-fill" : "eva:trending-down-fill"}
                  width={20}
                  sx={{ mr: 0.5 }}
                />
                <Typography variant="body2">
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Iconify icon={icon} width={32} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

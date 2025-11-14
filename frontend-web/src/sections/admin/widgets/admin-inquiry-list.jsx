import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function AdminInquiryList({ inquiries = [] }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "완료":
        return "success";
      case "접수":
        return "warning";
      default:
        return "default";
    }
  };

  if (!inquiries || inquiries.length === 0) {
    return (
      <Card>
        <CardHeader title="최근 문의 내역" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            최근 문의 내역이 없습니다.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="최근 문의 내역" />
      <CardContent sx={{ p: 0 }}>
        <List>
          {inquiries.map((inquiry, index) => (
            <ListItem
              key={inquiry.id || index}
              divider={index < inquiries.length - 1}
              sx={{ px: 3, py: 2 }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{inquiry.title}</Typography>
                    <Chip
                      label={inquiry.status}
                      size="small"
                      color={getStatusColor(inquiry.status)}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {inquiry.senderInfo?.user_name ||
                        inquiry.senderInfo?.shop_name ||
                        "알 수 없음"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

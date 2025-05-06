import { Badge } from "react-bootstrap";

export default function StreakCounter({ streak }) {
  return (
    <div className="streak-counter">
      <h5>
        Current Streak: 
        <Badge bg={streak > 0 ? "success" : "secondary"} className="ms-2">
          {streak} days
        </Badge>
      </h5>
      <small className="text-muted">Keep it going!</small>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function Community() {
  const [communityStats, setCommunityStats] = useState({
    totalActions: 0,
    totalPoints: 0,
    topHabit: '',
    leaderboard: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        // Get all users to calculate totals
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);
        
        let totalActions = 0;
        let totalPoints = 0;
        const habitCounts = {};
        const leaderboard = [];
        
        usersSnap.forEach(userDoc => {
          const userData = userDoc.data();
          totalPoints += userData.totalPoints || 0;
          
          // For leaderboard (only include users with points)
          if (userData.totalPoints > 0) {
            leaderboard.push({
              name: userData.displayName || userDoc.id.slice(0, 6),
              points: userData.totalPoints || 0
            });
          }
        });
        
        // Get all logs to count habits
        const allLogs = [];
        for (const userDoc of usersSnap.docs) {
          const logsRef = collection(db, "users", userDoc.id, "logs");
          const logsSnap = await getDocs(logsRef);
          logsSnap.forEach(logDoc => {
            allLogs.push(logDoc.data());
            totalActions += logDoc.data().habits.length;
            
            // Count habits
            logDoc.data().habits.forEach(habit => {
              habitCounts[habit] = (habitCounts[habit] || 0) + 1;
            });
          });
        }
        
        // Find top habit
        let topHabit = '';
        let maxCount = 0;
        for (const [habit, count] of Object.entries(habitCounts)) {
          if (count > maxCount) {
            maxCount = count;
            topHabit = habit.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          }
        }
        
        // Sort leaderboard
        leaderboard.sort((a, b) => b.points - a.points);
        
        setCommunityStats({
          totalActions,
          totalPoints,
          topHabit,
          leaderboard: leaderboard.slice(0, 10)
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to load community data: " + err.message);
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Community Impact</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Actions</Card.Title>
              <Card.Text className="display-6 text-success">
                {communityStats.totalActions.toLocaleString()}
              </Card.Text>
              <Card.Text>eco-friendly actions logged</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Points</Card.Title>
              <Card.Text className="display-6 text-success">
                {communityStats.totalPoints.toLocaleString()}
              </Card.Text>
              <Card.Text>eco points earned</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Top Habit</Card.Title>
              <Card.Text className="display-6 text-success">
                {communityStats.topHabit || 'N/A'}
              </Card.Text>
              <Card.Text>most common action this week</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Eco Leaderboard</Card.Title>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Eco Points</th>
              </tr>
            </thead>
            <tbody>
              {communityStats.leaderboard.map((user, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.points}</td>
                </tr>
              ))}
              {communityStats.leaderboard.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center">No data available yet</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Alert, Button } from "react-bootstrap";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Community() {
  const { user } = useAuth();
  const [communityStats, setCommunityStats] = useState({
    totalActions: 0,
    totalPoints: 0,
    topHabit: '',
    leaderboard: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 1. Fetch leaderboard (users with points > 0)
      const usersQuery = query(
        collection(db, "users"),
        where("totalPoints", ">", 0),
        orderBy("totalPoints", "desc"),
        limit(10)
      );
      
      const leaderboardSnapshot = await getDocs(usersQuery);
      const leaderboard = leaderboardSnapshot.docs.map(doc => ({
        name: doc.data().displayName || doc.id.slice(0, 6),
        points: doc.data().totalPoints
      }));

      // 2. Calculate totals (only from leaderboard users for efficiency)
      let totalPoints = 0;
      leaderboard.forEach(user => {
        totalPoints += user.points;
      });

      // 3. Get habit counts (only from current user's logs due to security rules)
      if (user) {
        const logsRef = collection(db, "users", user.uid, "logs");
        const logsSnap = await getDocs(logsRef);
        
        let totalActions = 0;
        const habitCounts = {};
        
        logsSnap.forEach(logDoc => {
          const logData = logDoc.data();
          totalActions += logData.habits?.length || 0;
          
          logData.habits?.forEach(habit => {
            habitCounts[habit] = (habitCounts[habit] || 0) + 1;
          });
        });

        // Find top habit from current user's data
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

        setCommunityStats({
          totalActions,
          totalPoints,
          topHabit,
          leaderboard
        });
      } else {
        // If not logged in, just show leaderboard
        setCommunityStats(prev => ({
          ...prev,
          totalPoints,
          leaderboard
        }));
      }
      
    } catch (err) {
      setError("Failed to load community data: " + err.message);
      console.error("Firestore error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [user]); // Re-fetch when user changes

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
      
      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={fetchCommunityData}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Row className="mb-4 g-4">
        <Col md={4}>
          <Card className="h-100 text-center">
            <Card.Body>
              <Card.Title>Total Points</Card.Title>
              <Card.Text className="display-5 text-success">
                {communityStats.totalPoints.toLocaleString()}
              </Card.Text>
              <Card.Text>eco points earned</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 text-center">
            <Card.Body>
              <Card.Title>Top Habit</Card.Title>
              <Card.Text className="display-5 text-success">
                {communityStats.topHabit || 'N/A'}
              </Card.Text>
              <Card.Text>
                {user ? "Your most common action" : "Sign in to see your habits"}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 text-center">
            <Card.Body>
              <Card.Title>My Actions</Card.Title>
              <Card.Text className="display-5 text-success">
                {user ? communityStats.totalActions.toLocaleString() : 'N/A'}
              </Card.Text>
              <Card.Text>
                {user ? "Your eco actions" : "Sign in to track"}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Card.Title>Eco Leaderboard</Card.Title>
          <Table striped bordered hover responsive>
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
                  <td colSpan="3" className="text-center">
                    {user ? "No community data yet" : "Sign in to see leaderboard"}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
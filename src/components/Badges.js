import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const badgeDefinitions = [
  { id: 'streak_7', name: '7-Day Streak', description: 'Logged eco actions for 7 consecutive days' },
  { id: 'streak_30', name: '30-Day Streak', description: 'Logged eco actions for 30 consecutive days' },
  { id: 'points_100', name: 'Eco Champion', description: 'Earned 100 eco points' },
  { id: 'points_500', name: 'Planet Saver', description: 'Earned 500 eco points' },
  { id: 'habit_carpooling', name: 'Carpool Master', description: 'Carpooled 15 times' },
  { id: 'habit_skipped_meat', name: 'Veggie Hero', description: 'Skipped meat 20 times' },
  { id: 'habit_no_plastic', name: 'Plastic Free', description: 'Had 10 no-plastic days' },
];

export default function Badges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchBadges = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setBadges(userSnap.data().badges || []);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load badges: " + err.message);
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

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
      <h2 className="mb-4">Your Badges</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row xs={1} md={2} lg={3} className="g-4">
        {badgeDefinitions.map(badgeDef => {
          const isUnlocked = badges.includes(badgeDef.id);
          
          return (
            <Col key={badgeDef.id}>
              <Card className={`h-100 ${isUnlocked ? '' : 'opacity-50'}`}>
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <Badge 
                      pill 
                      bg={isUnlocked ? "success" : "secondary"} 
                      style={{ fontSize: '3rem', width: '80px', height: '80px' }}
                    >
                      {isUnlocked ? '✓' : '?'}
                    </Badge>
                  </div>
                  <Card.Title>{badgeDef.name}</Card.Title>
                  <Card.Text>{badgeDef.description}</Card.Text>
                  {isUnlocked ? (
                    <Badge bg="success">Unlocked</Badge>
                  ) : (
                    <Badge bg="secondary">Locked</Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}
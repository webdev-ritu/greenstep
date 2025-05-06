import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore";
import HabitLog from "./HabitLog";
import StreakCounter from "./StreakCounter";
import StatsCharts from "./StatsCharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalCarbonSaved: 0,
    streak: 0
  });

  const habitOptions = [
    { id: "carpooling", name: "Carpooling", points: 1.5, carbon: 2.5 },
    { id: "reused_container", name: "Reused Container", points: 1, carbon: 0.5 },
    { id: "skipped_meat", name: "Skipped Meat", points: 2, carbon: 3.2 },
    { id: "public_transport", name: "Used Public Transport", points: 1.5, carbon: 2.8 },
    { id: "no_plastic", name: "No-Plastic Day", points: 1.2, carbon: 1.7 },
    { id: "other", name: "Other Eco Action", points: 1, carbon: 1 }
  ];

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Check if user has already logged today
        const logRef = doc(db, "users", user.uid, "logs", today);
        const logSnap = await getDoc(logRef);
        
        if (logSnap.exists()) {
          setTodayLog(logSnap.data());
        } else {
          setTodayLog(null);
        }

        // Get user stats
        const statsRef = doc(db, "users", user.uid);
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          setStats(statsSnap.data());
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load data: " + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleHabitSubmit = async (selectedHabits, notes) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const points = selectedHabits.reduce((sum, habitId) => {
        const habit = habitOptions.find(h => h.id === habitId);
        return sum + (habit ? habit.points : 0);
      }, 0);
      
      const carbon = selectedHabits.reduce((sum, habitId) => {
        const habit = habitOptions.find(h => h.id === habitId);
        return sum + (habit ? habit.carbon : 0);
      }, 0);
      
      // Update today's log
      const logRef = doc(db, "users", user.uid, "logs", today);
      await setDoc(logRef, {
        date: today,
        habits: selectedHabits,
        notes,
        points,
        carbon
      });
      
      // Update user stats
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      const currentStats = userSnap.exists() ? userSnap.data() : {
        totalPoints: 0,
        totalCarbonSaved: 0,
        streak: 0,
        lastLogDate: null
      };
      
      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = currentStats.streak;
      if (currentStats.lastLogDate === yesterdayStr) {
        newStreak += 1;
      } else if (currentStats.lastLogDate !== today) {
        newStreak = 1;
      }
      
      await setDoc(userRef, {
        totalPoints: (currentStats.totalPoints || 0) + points,
        totalCarbonSaved: (currentStats.totalCarbonSaved || 0) + carbon,
        streak: newStreak,
        lastLogDate: today,
        displayName: user.email.split('@')[0]
      }, { merge: true });
      
      setTodayLog({ date: today, habits: selectedHabits, notes, points, carbon });
      setStats(prev => ({
        totalPoints: prev.totalPoints + points,
        totalCarbonSaved: prev.totalCarbonSaved + carbon,
        streak: newStreak
      }));
      
      setLoading(false);
    } catch (err) {
      setError("Failed to save habits: " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={8}>
          <h2 className="text-success">Welcome back, {user.email.split('@')[0]}!</h2>
          <p className="text-muted">Track your eco-friendly habits and see your impact.</p>
        </Col>
        <Col md={4} className="text-end">
          <StreakCounter streak={stats.streak} />
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Today's Eco Actions</Card.Title>
              <HabitLog 
                habitOptions={habitOptions} 
                todayLog={todayLog} 
                onSubmit={handleHabitSubmit} 
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Your Impact Today</Card.Title>
              {todayLog ? (
                <>
                  <p>Eco Points: <strong>{todayLog.points}</strong></p>
                  <p>Carbon Saved: <strong>{todayLog.carbon} kg</strong></p>
                  {todayLog.notes && (
                    <div className="mt-3">
                      <h6>Notes:</h6>
                      <p>{todayLog.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <p>No actions logged yet today.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <StatsCharts userId={user.uid} />
        </Col>
      </Row>
    </Container>
  );
}
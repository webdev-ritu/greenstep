import { useState, useEffect } from "react";
import { Card, Tabs, Tab } from "react-bootstrap";
import { Line, Pie } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function StatsCharts({ userId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('weekly');

  useEffect(() => {
    if (!userId) return;

    const fetchLogs = async () => {
      try {
        const logsRef = collection(db, "users", userId, "logs");
        const q = query(logsRef);
        const querySnapshot = await getDocs(q);
        
        const logsData = [];
        querySnapshot.forEach(doc => {
          logsData.push(doc.data());
        });
        
        // Sort by date
        logsData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setLogs(logsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching logs: ", err);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userId]);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (logs.length === 0) {
    return <div>No data available yet. Start logging your eco actions!</div>;
  }

  // Prepare data for charts
  const last7Days = logs.slice(-7);
  const last30Days = logs.slice(-30);

  const lineChartData = {
    labels: key === 'weekly' 
      ? last7Days.map(log => log.date) 
      : last30Days.map(log => log.date),
    datasets: [
      {
        label: 'Eco Points',
        data: key === 'weekly' 
          ? last7Days.map(log => log.points) 
          : last30Days.map(log => log.points),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Calculate habit frequency for pie chart
  const habitCounts = {};
  logs.forEach(log => {
    log.habits.forEach(habit => {
      habitCounts[habit] = (habitCounts[habit] || 0) + 1;
    });
  });

  const pieChartData = {
    labels: Object.keys(habitCounts).map(habit => {
      // Convert habit ID to readable name (you might want to map this properly)
      return habit.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }),
    datasets: [
      {
        data: Object.values(habitCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Card>
      <Card.Body>
        <Tabs
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="mb-3"
        >
          <Tab eventKey="weekly" title="Last 7 Days">
            <div className="chart-container">
              <h5>Eco Points Trend</h5>
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  }
                }}
              />
            </div>
          </Tab>
          <Tab eventKey="monthly" title="Last 30 Days">
            <div className="chart-container">
              <h5>Eco Points Trend</h5>
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  }
                }}
              />
            </div>
          </Tab>
          <Tab eventKey="habits" title="Habit Distribution">
            <div className="chart-container">
              <h5>Your Most Common Eco Actions</h5>
              <Pie 
                data={pieChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  }
                }}
              />
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
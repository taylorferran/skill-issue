import { styles } from "./CircularProgress.styles";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Theme } from "@/theme/Theme";

interface SimpleCircularProgressProps {
  current: number;
  total: number;
}

const CircularProgress: React.FC<SimpleCircularProgressProps> = ({
  current,
  total,
}) => {
  const progress = current / total;
  const percentage = Math.round(progress * 100);

  // Circle properties
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={styles.simpleGaugeContainer}>
      <View style={styles.svgContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            stroke={Theme.colors.timeline.trackInactive}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <Circle
            stroke={Theme.colors.primary.main}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        
        {/* Center text */}
        <View style={styles.gaugeInner}>
          <Text style={styles.gaugeNumber}>
            {current}
            <Text style={styles.gaugeTotal}>/{total}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CircularProgress;

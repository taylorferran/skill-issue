import { styles } from "./CircularProgress.styles";
import { Text, View} from "react-native";

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

  return (
    <View style={styles.simpleGaugeContainer}>
      {/* Outer ring - background */}
      <View style={styles.gaugeOuter}>
        {/* Inner content */}
        <View style={styles.gaugeInner}>
          <Text style={styles.gaugeNumber}>
            {current}
            <Text style={styles.gaugeTotal}>/{total}</Text>
          </Text>
        </View>

        {/* Progress indicators (dots/segments) - optional visual enhancement */}
        {percentage > 0 && (
          <View style={styles.progressIndicatorContainer}>
            {Array.from({
              length: Math.min(10, Math.ceil(percentage / 10)),
            }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    transform: [{ rotate: `${i * 36}deg` }, { translateX: 75 }],
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default CircularProgress;

import { MaterialIcons } from "@expo/vector-icons";
import { View, Text } from "react-native"
import { styles } from "./StatCard.styles";

interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  subtitleColor?: string;
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  iconFilled?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  subtitleColor,
  iconName,
  iconColor,
  iconFilled = false,
}) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <MaterialIcons name={iconName} size={20} color={iconColor} />
      </View>

      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text
          style={[
            styles.statSubtitle,
            subtitleColor && { color: subtitleColor },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};


export default StatCard;

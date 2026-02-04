import { MaterialIcons } from "@expo/vector-icons";
import { View, Text } from "react-native"
import { styles } from "./StatCard.styles";

interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  subtitle: string | React.ReactNode;
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
        {typeof value === 'string' ? (
          <Text style={styles.statValue}>{value}</Text>
        ) : (
          <View>{value}</View>
        )}
        {typeof subtitle === 'string' ? (
          <Text
            style={[
              styles.statSubtitle,
              subtitleColor && { color: subtitleColor },
            ]}
          >
            {subtitle}
          </Text>
        ) : (
          <View style={subtitleColor ? { marginTop: 2 } : undefined}>
            {subtitle}
          </View>
        )}
      </View>
    </View>
  );
};


export default StatCard;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../store/hooks';
import { completeOnboarding } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  description: string;
  image: any; // React Native require() returns a number
  gradientColors: [string, string, string]; // Tuple of colors for gradient overlay
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Welcome to Car Wash and Carpet Cleaning Manager',
    description: 'Streamline your car wash and carpet cleaning business with our comprehensive management solution.',
    image: require('../../../assets/onBoarding/slide3.jpg'),
    gradientColors: ['rgba(249, 115, 22, 0.9)', 'rgba(249, 115, 22, 0.3)', 'transparent'] as [string, string, string], // Orange gradient
  },
  {
    id: 2,
    title: 'Professional Car Wash',
    description: 'From sedans to SUVs, we provide premium car wash services with eco-friendly products and state-of-the-art equipment.',
    image: require('../../../assets/onBoarding/slide1.png'),
    gradientColors: ['rgba(249, 115, 22, 0.9)', 'rgba(249, 115, 22, 0.3)', 'transparent'] as [string, string, string], // Orange gradient
  },
  {
    id: 3,
    title: 'Expert Carpet Cleaning',
    description: 'Transform your home and office spaces with our deep cleaning services. We handle all carpet types with professional-grade equipment.',
    image: require('../../../assets/onBoarding/slide2.png'),
    gradientColors: ['rgba(249, 115, 22, 0.9)', 'rgba(249, 115, 22, 0.3)', 'transparent'] as [string, string, string], // Orange gradient
  },
];

export const WelcomeSlides: React.FC = () => {
  const dispatch = useAppDispatch();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      dispatch(completeOnboarding());
    }
  };


  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const renderSlide = (slide: Slide) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <ImageBackground
        source={slide.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <LinearGradient
          colors={slide.gradientColors}
          style={styles.gradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        >
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-white text-3xl font-bold text-center mb-4">
              {slide.title}
            </Text>

            <Text className="text-white text-lg text-center leading-6 opacity-90">
              {slide.description}
            </Text>
          </View>

          {/* Pagination dots - positioned at the bottom of each slide */}
          <View className="absolute bottom-40 left-0 right-0 px-8">
            <View className="flex-row justify-center">
              {slides.map((s) => (
                <View
                  key={s.id}
                  className={`w-2 h-2 rounded-full mx-1 ${s.id === currentSlide + 1 ? 'bg-white' : 'bg-white opacity-30'
                    }`}
                />
              ))}
            </View>
          </View>

          {/* Action buttons only on the last slide - positioned at the very bottom */}
          {slide.id === slides.length && (
            <View className="absolute bottom-0 left-0 right-0 px-8 pb-8">
              <View className="flex-row justify-between items-center w-full">
                <TouchableOpacity
                  onPress={handleNext}
                  className="bg-white px-8 py-3 rounded-full w-full"
                >
                  <Text className="text-blue-500 text-base font-semibold text-center">
                    Get Started
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {slides.map(renderSlide)}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

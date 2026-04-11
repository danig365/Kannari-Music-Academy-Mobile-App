import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'

/**
 * Unified Loading Spinner Component for Kannari Music Academy
 * 
 * @param {string} size - 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} text - Loading text to display (optional)
 * @param {boolean} fullScreen - Whether to show full screen loading (default: false)
 * @param {string} variant - 'primary', 'light', 'dark' (default: 'primary')
 * @param {boolean} inline - Whether to show inline (for buttons/small areas) (default: false)
 */
const LoadingSpinner = ({ 
    size = 'md', 
    text = '', 
    fullScreen = false,
    variant = 'light',
    inline = false
}) => {
    const bar1Anim = useRef(new Animated.Value(0)).current
    const bar2Anim = useRef(new Animated.Value(0)).current
    const bar3Anim = useRef(new Animated.Value(0)).current
    const bar4Anim = useRef(new Animated.Value(0)).current
    const bar5Anim = useRef(new Animated.Value(0)).current
    const textOpacityAnim = useRef(new Animated.Value(0.7)).current

    useEffect(() => {
        const createWaveAnimation = (animValue, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: 500,
                        delay,
                        useNativeDriver: false,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: false,
                    }),
                ])
            )
        }

        const textPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(textOpacityAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(textOpacityAnim, {
                    toValue: 0.7,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        )

        Animated.parallel([
            createWaveAnimation(bar1Anim, 0),
            createWaveAnimation(bar2Anim, 100),
            createWaveAnimation(bar3Anim, 200),
            createWaveAnimation(bar4Anim, 300),
            createWaveAnimation(bar5Anim, 400),
            textPulse,
        ]).start()
    }, [])

    const sizeStyles = {
        sm: styles.spinner_sm,
        md: styles.spinner_md,
        lg: styles.spinner_lg,
        xl: styles.spinner_xl,
    }

    const inlineSizeStyles = {
        sm: styles.inline_spinner_sm,
        md: styles.inline_spinner_md,
        lg: styles.inline_spinner_lg,
        xl: styles.inline_spinner_xl,
    }

    const getBarHeights = (isInline = false) => {
        if (isInline) {
            return { bar1: '24%', bar2: '32%', bar3: '40%', bar4: '28%', bar5: '20%' }
        }
        const heights = {
            sm: { bar1: '24%', bar2: '32%', bar3: '40%', bar4: '28%', bar5: '20%' },
            md: { bar1: '30%', bar2: '40%', bar3: '50%', bar4: '35%', bar5: '25%' },
            lg: { bar1: '42%', bar2: '56%', bar3: '70%', bar4: '49%', bar5: '35%' },
            xl: { bar1: '54%', bar2: '72%', bar3: '90%', bar4: '63%', bar5: '45%' },
        }
        return heights[size] || heights.md
    }

    const barHeights = getBarHeights(inline)
    const sizeStyle = inline ? inlineSizeStyles.sm : (sizeStyles[size] || sizeStyles.md)
    const variantStyle = styles[`variant_${variant}`] || styles.variant_primary

    const Bar = ({ animValue, height, delay }) => {
        const scaleY = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        })

        return (
            <Animated.View
                style={[
                    styles.bar,
                    variantStyle.bar,
                    sizeStyle.bar,
                    { height, transform: [{ scaleY }] },
                ]}
            />
        )
    }

    const content = (
        <View style={styles.loading_content}>
            <View style={[styles.music_loader, sizeStyle]}>
                <Bar animValue={bar1Anim} height={barHeights.bar1} delay={0} />
                <Bar animValue={bar2Anim} height={barHeights.bar2} delay={100} />
                <Bar animValue={bar3Anim} height={barHeights.bar3} delay={200} />
                <Bar animValue={bar4Anim} height={barHeights.bar4} delay={300} />
                <Bar animValue={bar5Anim} height={barHeights.bar5} delay={400} />
            </View>
            {text && !inline && (
                <Animated.Text
                    style={[
                        styles.loading_text,
                        variantStyle.text,
                        { opacity: textOpacityAnim },
                    ]}
                >
                    {text}
                </Animated.Text>
            )}
        </View>
    )

    if (inline) {
        return (
            <View style={styles.loading_inline}>
                {content}
            </View>
        )
    }

    if (fullScreen) {
        return (
            <View style={[styles.loading_fullscreen, variantStyle.fullscreenContainer]}>
                {content}
            </View>
        )
    }

    return (
        <View style={[styles.loading_container, variantStyle.container]}>
            {content}
        </View>
    )
}

const styles = StyleSheet.create({
    loading_container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        width: '100%',
        paddingVertical: 40,
        paddingHorizontal: 20,
        flex: 1,
    },
    loading_fullscreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    loading_inline: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loading_content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
    },
    music_loader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 6,
    },
    bar: {
        borderRadius: 4,
        transformOrigin: 'bottom',
    },
    loading_text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    variant_primary: {
        container: {
            backgroundColor: 'transparent',
        },
        fullscreenContainer: {
            backgroundColor: '#3b82f6',
        },
        bar: {
            backgroundColor: '#ffffff',
            shadowColor: 'rgba(255, 255, 255, 0.5)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 8,
        },
        text: {
            color: '#ffffff',
        },
    },
    variant_light: {
        container: {
            backgroundColor: 'transparent',
        },
        fullscreenContainer: {
            backgroundColor: 'rgba(248, 250, 252, 0.92)',
        },
        bar: {
            backgroundColor: '#3b82f6',
            shadowColor: 'rgba(59, 130, 246, 0.4)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 6,
        },
        text: {
            color: '#1e293b',
            fontWeight: '600',
        },
    },
    variant_dark: {
        container: {
            backgroundColor: 'transparent',
        },
        fullscreenContainer: {
            backgroundColor: '#1e293b',
        },
        bar: {
            backgroundColor: '#60a5fa',
            shadowColor: 'rgba(96, 165, 250, 0.5)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 8,
        },
        text: {
            color: '#e2e8f0',
        },
    },
    spinner_sm: {
        height: 30,
        bar: {
            width: 5,
            borderRadius: 3,
        },
    },
    spinner_md: {
        height: 50,
        bar: {
            width: 8,
            borderRadius: 4,
        },
    },
    spinner_lg: {
        height: 70,
        bar: {
            width: 10,
            borderRadius: 5,
        },
    },
    spinner_xl: {
        height: 90,
        bar: {
            width: 14,
            borderRadius: 7,
        },
    },
    inline_spinner_sm: {
        height: 20,
        bar: {
            width: 3,
            borderRadius: 2,
        },
    },
    inline_spinner_md: {
        height: 25,
        bar: {
            width: 4,
            borderRadius: 2,
        },
    },
    inline_spinner_lg: {
        height: 30,
        bar: {
            width: 5,
            borderRadius: 2,
        },
    },
    inline_spinner_xl: {
        height: 35,
        bar: {
            width: 6,
            borderRadius: 3,
        },
    },
})

export default LoadingSpinner

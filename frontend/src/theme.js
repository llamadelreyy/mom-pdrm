import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  colors: {
    primary: {
      50: '#e3f2ff',
      100: '#b3dbfe',
      200: '#81c4fd',
      300: '#4eacfc',
      400: '#1b95fb',
      500: '#027dfa',
      600: '#0265d8',
      700: '#024db6',
      800: '#013594',
      900: '#011d72',
    },
    secondary: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    surface: {
      light: '#ffffff',
      dark: '#1a1d23',
    },
  },
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    cardHover: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.07)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xlarge: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        transition: 'all 0.2s',
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : undefined,
          color: props.colorScheme === 'primary' ? 'white' : undefined,
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.600' : undefined,
            transform: 'translateY(-1px)',
            shadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        outline: {
          borderWidth: '2px',
          _hover: {
            transform: 'translateY(-1px)',
            shadow: 'md',
          },
        },
        ghost: {
          _hover: {
            transform: 'translateY(-1px)',
          },
        },
      },
      sizes: {
        lg: {
          h: '48px',
          px: '24px',
          fontSize: 'md',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          shadow: 'card',
          transition: 'all 0.2s',
          _hover: {
            shadow: 'cardHover',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.025em',
      },
      sizes: {
        lg: {
          fontSize: ['2xl', '3xl'],
          lineHeight: 'shorter',
        },
        xl: {
          fontSize: ['3xl', '4xl'],
          lineHeight: 'shorter',
        },
      },
    },
    Text: {
      baseStyle: {
        fontSize: 'md',
        lineHeight: 'tall',
      },
      variants: {
        body: {
          color: 'gray.600',
        },
        caption: {
          fontSize: 'sm',
          color: 'gray.500',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          transition: 'all 0.2s',
          _focus: {
            borderColor: 'primary.500',
            shadow: '0 0 0 1px rgba(2, 125, 250, 0.6)',
          },
        },
      },
      variants: {
        outline: {
          field: {
            borderWidth: '2px',
            _hover: {
              borderColor: 'gray.300',
            },
          },
        },
      },
      sizes: {
        lg: {
          field: {
            fontSize: 'md',
            h: '48px',
            px: '16px',
          },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontWeight: '600',
        fontSize: 'sm',
        mb: '8px',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            fontWeight: '700',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: 'wider',
            borderBottomWidth: '2px',
            borderBottomColor: 'gray.200',
            bg: 'gray.50',
            _dark: {
              bg: 'gray.800',
              borderBottomColor: 'gray.600',
            },
          },
          td: {
            fontSize: 'sm',
            borderBottomWidth: '1px',
            py: '16px',
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          shadow: 'xlarge',
        },
        header: {
          fontWeight: '700',
          fontSize: 'xl',
          pb: '16px',
        },
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
        },
      },
    },
    Progress: {
      baseStyle: {
        track: {
          borderRadius: 'full',
        },
        filledTrack: {
          borderRadius: 'full',
        },
      },
    },
    Stat: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          p: '24px',
        },
        label: {
          fontWeight: '600',
          fontSize: 'sm',
          color: 'gray.600',
          textTransform: 'uppercase',
          letterSpacing: 'wide',
        },
        number: {
          fontWeight: '800',
          fontSize: '3xl',
          lineHeight: 'none',
          mt: '8px',
        },
        helpText: {
          fontSize: 'sm',
          color: 'gray.500',
          mt: '4px',
        },
      },
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : '#fafbfc',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        lineHeight: 'tall',
      },
      '*': {
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
      },
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
        borderRadius: 'full',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
      },
    }),
  },
});

export default theme;
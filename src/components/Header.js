import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  styled,
  Divider,
} from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;
const miniDrawerWidth = 100;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const LogoText = styled('div')(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: theme.spacing(1),
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  '& .first-letter': {
    fontSize: '1.2rem',
  },
  '& .second-letter': {
    fontSize: '1.2rem',
    marginLeft: theme.spacing(0.5),
    marginRight: open ? 0 : theme.spacing(0.5),
  },
  '& .expanded-text': {
    maxWidth: open ? '200px' : '0',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: theme.transitions.create('max-width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  '& .me': {
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: '0.2s',
      delay: '0.1s',
    }),
    opacity: open ? 1 : 0,
  },
  '& .space': {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
    opacity: open ? 1 : 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: '0.2s',
      delay: '0.15s',
    }),
  },
  '& .controls': {
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: '0.2s',
      delay: '0.2s',
    }),
    opacity: open ? 1 : 0,
  },
}));

function Header({ onRefresh, refreshing }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Tabular View', icon: <TableChartIcon />, path: '/table' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : miniDrawerWidth}px)` },
          ml: { sm: `${drawerOpen ? drawerWidth : miniDrawerWidth}px` },
          transition: theme =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Temperature Monitoring Dashboard
          </Typography>
          <Button
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : miniDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : miniDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <DrawerHeader>
          <LogoText open={drawerOpen}>
            <span className="first-letter">A</span>
            <span className="expanded-text">
              <span className="me">CME</span>
            </span>
            <span className="space"> </span>
            <span className="second-letter">C</span>
            <span className="expanded-text">
              <span className="controls">ONTROLS</span>
            </span>
          </LogoText>
          <IconButton 
            onClick={toggleDrawer}
            sx={{ 
              mr: drawerOpen ? 0 : 1,
              ml: drawerOpen ? 0 : 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              },
              position: drawerOpen ? 'relative' : 'absolute',
              right: drawerOpen ? 'auto' : 4
            }}
          >
            {drawerOpen ? <KeyboardDoubleArrowLeftIcon /> : <KeyboardDoubleArrowRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: drawerOpen ? 1 : 0 }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}

export default Header;
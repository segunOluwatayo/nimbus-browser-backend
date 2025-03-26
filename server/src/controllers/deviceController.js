const ConnectedDevice = require('../models/ConnectedDevice');
const crypto = require('crypto');
const geoip = require('geoip-lite');

// Helper function to generate a unique device ID
const generateDeviceId = (userAgent, ip) => {
  const fingerprint = `${userAgent}|${ip}|${Date.now()}`;
  return crypto.createHash('md5').update(fingerprint).digest('hex');
};

// Helper function to get device info from user agent
const getDeviceInfo = (userAgent, ip) => {
  let type = 'unknown';
  let name = 'Unknown Device';
  let browser = 'Unknown';
  let os = 'Unknown';
  let location = 'Unknown Location';

  // Very basic user agent parsing
  if (userAgent) {
    if (userAgent.includes('Mobile')) {
      type = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      type = 'tablet';
    } else {
      type = 'desktop';
    }

    // Detect browser
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
    }

    // Detect OS
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    }

    name = `${browser} on ${os}`;
  }

  // Get location information from IP using geoip-lite
  try {
    // For local IPs (like 127.0.0.1 or 192.168.x.x), geoip won't work
    // We need to handle these special cases
    if (ip && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.')) {
      const geo = geoip.lookup(ip);
      if (geo) {
        const city = geo.city || 'Unknown City';
        const regionName = geo.region || '';
        const country = geo.country || 'Unknown Country';
        
        // Format the location as "City, Region, Country" or "City, Country" if no region
        if (regionName) {
          location = `${city}, ${regionName}, ${country}`;
        } else {
          location = `${city}, ${country}`;
        }
      }
    } else {
      // For local connections, we can detect that it's a local network
      location = 'Local Network';
    }
  } catch (error) {
    console.error("Error getting location from IP:", error);
    // Fall back to Unknown Location
  }

  return {
    name,
    type,
    browser,
    os,
    location
  };
};

// Get all devices for the current user
exports.getDevices = async (req, res) => {
  try {
    const devices = await ConnectedDevice.find({ userId: req.user.id })
      .sort({ lastActive: -1 });
    
    // Identify the current device
    const currentDeviceId = req.headers['x-device-id'];
    
    const enhancedDevices = devices.map(device => {
      const deviceObj = device.toObject();
      deviceObj.isCurrentDevice = (device.deviceId === currentDeviceId);
      return deviceObj;
    });
    
    res.status(200).json({ 
      message: 'Connected devices retrieved successfully', 
      data: enhancedDevices 
    });
  } catch (error) {
    console.error("Error retrieving devices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register a new device or update existing one
exports.registerDevice = async (req, res) => {
  try {
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceId = req.body.deviceId || generateDeviceId(userAgent, ip);
    
    // Get device information
    const deviceInfo = getDeviceInfo(userAgent, ip);
    
    // Check if device already exists for this user
    let device = await ConnectedDevice.findOne({ 
      userId: req.user.id, 
      deviceId: deviceId 
    });
    
    if (device) {
      // Update last active timestamp and other info if needed
      device.lastActive = new Date();
      device.ipAddress = ip;
      device.location = deviceInfo.location;
      await device.save();
    } else {
      // Create new device record
      device = new ConnectedDevice({
        userId: req.user.id,
        deviceId: deviceId,
        name: deviceInfo.name,
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: ip,
        location: deviceInfo.location,
      });
      await device.save();
    }
    
    res.status(200).json({ 
      message: 'Device registered successfully', 
      data: { 
        deviceId, 
        ...device.toObject() 
      } 
    });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove a device
exports.removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Don't allow removing the current device
    const currentDeviceId = req.headers['x-device-id'];
    if (deviceId === currentDeviceId) {
      return res.status(400).json({ message: "Cannot remove current device" });
    }
    
    const result = await ConnectedDevice.findOneAndDelete({ 
      userId: req.user.id, 
      deviceId: deviceId 
    });
    
    if (!result) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    res.status(200).json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error("Error removing device:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update the last active timestamp for a device
exports.updateLastActive = async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'];
    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }
    
    const device = await ConnectedDevice.findOneAndUpdate(
      { userId: req.user.id, deviceId: deviceId },
      { lastActive: new Date() },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    res.status(200).json({ 
      message: 'Device updated successfully', 
      data: device 
    });
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
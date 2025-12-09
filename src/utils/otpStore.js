module.exports = {
  otps: new Map(),

  setOTP(userId, code) {
    this.otps.set(userId, {
      code,
      expires: Date.now() + 5 * 60 * 1000 // expira en 5 min
    });
  },

  verifyOTP(userId, code) {
    const entry = this.otps.get(userId);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.otps.delete(userId);
      return false;
    }

    if (entry.code === code) {
      this.otps.delete(userId);
      return true;
    }

    return false;
  }
};
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      // Only require password if the user is not authenticating via Google
      required: function () {
        return !this.googleId;
      },
      minlength: [9, "Password must be at least 9 characters long"],
      select: false, // Prevents password hash from leaking in standard queries
    },

    profileImage: {
      type: String,
      default: "",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents without a googleId, while enforcing uniqueness for those that have it
    },

    // User Roles
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },

    // Email Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Password Reset
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;

  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model overwrite error in hot-reload / serverless environments
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
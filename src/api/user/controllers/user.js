'use strict';

const bcrypt = require('bcryptjs');


async function register(ctx) {
  const { username, email, password, role } = ctx.request.body;

  if (!email || !password) {
    return ctx.badRequest('Email and password are required');
  }

  try {
    const allRoles = await strapi.db.query('plugin::users-permissions.role').findMany();
    console.log('All roles:', allRoles);

    const roleName = (role || 'authenticated').trim();

    let userRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: roleName },
    });

    if (!userRole) {
      console.warn(`Role "${roleName}" not found, defaulting to "Authenticated"`);
      userRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { name: 'Authenticated' },
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await strapi.plugins['users-permissions'].services.user.add({
      username,
      email,
      password:hashedPassword,
      role: userRole.id,
    });

    console.log('Created user:', user);

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: userRole.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return ctx.send({
      success: true,
      message: 'User registered successfully',
      data: sanitizedUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return ctx.internalServerError('Registration failed');
  }
}; 

async function login(ctx) {
  const { identifier, password } = ctx.request.body;

  if (!identifier || !password) {
    return ctx.badRequest('Email/username and password are required');
  }

  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: identifier }, 
      populate: ['role'],
    });

    if (!user) {
      return ctx.unauthorized('Invalid credentials');
    }

    const validPassword = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, user.password);

    if (!validPassword) {
      return ctx.unauthorized('Invalid credentials');
    }

    //Issue JWT with role also included
    const token = strapi
      .plugin('users-permissions')
      .service('jwt')
      .issue({
        id: user.id,
        role: user.role?.name,  
      });

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name,
      confirmed: user.confirmed,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return ctx.send({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizedUser,
        token: token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return ctx.internalServerError('Login failed');
  }
}

async function logout(ctx) {
  try {
    return ctx.send({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    console.error('Logout error:', err);
    return ctx.internalServerError('Logout failed');
  }
}
/**
 * Get logged-in user's profile
 */
async function getProfile(ctx) {
  try {
    const userId = ctx.state.user?.id; // comes from JWT
    if (!userId) return ctx.unauthorized('Not authenticated');

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    });

    if (!user) return ctx.notFound('User not found');

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return ctx.send({
      success: true,
      message:"user profile get successfully",
      data: sanitizedUser,
    });
  } catch (err) {
    console.error('Get Profile error:', err);
    return ctx.internalServerError('Failed to fetch profile');
  }
}


async function updateProfile(ctx) {
  try {
    const requester = ctx.state.user; // who is making the request
    if (!requester) return ctx.unauthorized('Not authenticated');

    let targetUserId = requester.id; // default: self

    // If admin, allow updating others
    if (requester.role?.type === 'admin' && ctx.params.id) {
      targetUserId = parseInt(ctx.params.id, 10);
    }

    const { username, email, password, role } = ctx.request.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
     if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Only Admin can change roles
    if (role && requester.role?.type === 'admin') {
      const roleEntity = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { name: role },
      });
      if (!roleEntity) return ctx.badRequest('Invalid role');
      updateData.role = roleEntity.id;
    }

    const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: targetUserId },
      data: updateData,
    });

    return ctx.send({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role, // might need populate again
      },
    });
  } catch (err) {
    console.error('Update Profile error:', err);
    return ctx.internalServerError('Failed to update profile');
  }
}


module.exports = {
  register,
  login, 
  logout,
  getProfile,
  updateProfile
  
};
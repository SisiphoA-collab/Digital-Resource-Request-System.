import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Component, user, ...rest }) => {
  return (
    <Route
      {...rest}
      element={user ? <Component /> : <Navigate to="/auth" />}
    />
  );
};

export default ProtectedRoute;
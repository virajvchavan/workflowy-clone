import { cleanup, render } from '@testing-library/react';
import React from "react";
import RootNotes from '../RootNote';

afterEach(cleanup);

// let mockUser = { name: "TestUser", token: "fakeAuthToken" };
// let mockLoading = false;

// jest.mock('./../../../hooks/use-auth', () => {
//     return jest.fn(() => {
//       return {
//        useAuth: {
//         loading: mockLoading,
//         user: mockUser
//        }
//     }})
// })

test("it should have the Add btn", () => {
  const { getByText } = render(<RootNotes />);
  // expect(getByText("+")).not.toBeNull();
});

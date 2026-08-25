import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Membership, StoreRole } from "@/lib/types/members";
import { createApiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { RootState } from "@/lib/store";

export interface MembersState {
  members: Membership[];
  loading: boolean;
  error: string | null;
}

const initialState: MembersState = {
  members: [],
  loading: false,
  error: null,
};

// fetchMembers Thunk
export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async (storeId: string, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<Membership[]>(
        API_ENDPOINTS.backend.stores.members,
        { headers: { "X-Store-ID": storeId } }
      );
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch members");
    }
  }
);

// inviteMember Thunk
export const inviteMember = createAsyncThunk(
  "members/inviteMember",
  async (payload: { phone: string; role: StoreRole }, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<Membership>(API_ENDPOINTS.backend.stores.inviteMember, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to invite member");
    }
  }
);

// removeMember Thunk
export const removeMember = createAsyncThunk(
  "members/removeMember",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      await client.delete(API_ENDPOINTS.backend.stores.memberById(userId));
      return userId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to remove member");
    }
  }
);

// updatePermissions Thunk
export const updatePermissions = createAsyncThunk(
  "members/updatePermissions",
  async (
    payload: { userId: string; overrides: Record<string, boolean> },
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.put<{ permissions: { overrides?: Record<string, boolean> } }>(
        API_ENDPOINTS.backend.stores.memberPermissions(payload.userId),
        { overrides: payload.overrides }
      );
      return { userId: payload.userId, permissions: data.permissions };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update permissions");
    }
  }
);

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    clearMembersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMembers
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // inviteMember
      .addCase(inviteMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        state.loading = false;
        // Append newly invited member
        state.members.push(action.payload);
      })
      .addCase(inviteMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // removeMember
      .addCase(removeMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members = state.members.filter((m) => m.user_id !== action.payload);
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updatePermissions
      .addCase(updatePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePermissions.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.members.findIndex((m) => m.user_id === action.payload.userId);
        if (index !== -1) {
          state.members[index].permissions = action.payload.permissions;
        }
      })
      .addCase(updatePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMembersError } = membersSlice.actions;
export default membersSlice.reducer;

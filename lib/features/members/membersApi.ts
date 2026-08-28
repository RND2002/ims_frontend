import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Membership, StoreRole } from "@/lib/types/members";

export const membersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query<Membership[], void>({
      query: () => API_ENDPOINTS.backend.stores.members,
      providesTags: ["Member"],
    }),
    inviteMember: builder.mutation<Membership, { phone: string; role: StoreRole }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.stores.inviteMember,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Member"],
    }),
    removeMember: builder.mutation<void, string>({
      query: (userId) => ({
        url: API_ENDPOINTS.backend.stores.memberById(userId),
        method: "DELETE",
      }),
      invalidatesTags: ["Member"],
    }),
    updatePermissions: builder.mutation<
      { permissions: { overrides?: Record<string, boolean> } },
      { userId: string; overrides: Record<string, boolean> }
    >({
      query: ({ userId, overrides }) => ({
        url: API_ENDPOINTS.backend.stores.memberPermissions(userId),
        method: "PUT",
        body: { overrides },
      }),
      invalidatesTags: ["Member"],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useUpdatePermissionsMutation,
} = membersApi;

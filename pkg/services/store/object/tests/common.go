package object_server_tests

import (
	"testing"

	apikeygenprefix "github.com/grafana/grafana/pkg/components/apikeygenprefixed"
	"github.com/grafana/grafana/pkg/server"
	"github.com/grafana/grafana/pkg/services/org"
	saAPI "github.com/grafana/grafana/pkg/services/serviceaccounts/api"
	saTests "github.com/grafana/grafana/pkg/services/serviceaccounts/tests"
	"github.com/grafana/grafana/pkg/services/store/object"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/stretchr/testify/require"
)

func createServiceAccountAdminToken(t *testing.T, env *server.TestEnv) (string, *user.SignedInUser) {
	t.Helper()

	account := saTests.SetupUserServiceAccount(t, env.SQLStore, saTests.TestUser{
		Name:             "grpc-server-sa",
		Role:             string(org.RoleAdmin),
		Login:            "grpc-server-sa",
		IsServiceAccount: true,
		OrgID:            1,
	})

	keyGen, err := apikeygenprefix.New(saAPI.ServiceID)
	require.NoError(t, err)

	_ = saTests.SetupApiKey(t, env.SQLStore, saTests.TestApiKey{
		Name:             "grpc-server-test",
		Role:             org.RoleAdmin,
		OrgId:            account.OrgID,
		Key:              keyGen.HashedKey,
		ServiceAccountID: &account.ID,
	})

	return keyGen.ClientSecret, &user.SignedInUser{
		UserID: account.ID,
		Email:  account.Email,
		Name:   account.Name,
		Login:  account.Login,
		OrgID:  account.OrgID,
	}
}

type testContext struct {
	authToken string
	client    object.ObjectStoreClient
	user      *user.SignedInUser
}

func createTestContext(t *testing.T) testContext {
	t.Helper()

	dir, path := testinfra.CreateGrafDir(t, testinfra.GrafanaOpts{
		EnableFeatureToggles: []string{"grpcServer"},
		GRPCServerAddress:    "127.0.0.1:0", // :0 for choosing the port automatically
	})
	_, env := testinfra.StartGrafanaEnv(t, dir, path)

	authToken, serviceAccountUser := createServiceAccountAdminToken(t, env)

	//conn, err := grpc.Dial(
	//	env.GRPCServer.GetAddress(),
	//	grpc.WithTransportCredentials(insecure.NewCredentials()),
	//)
	//require.NoError(t, err)

	//client := object.NewObjectStoreClient(conn)

	return testContext{
		authToken: authToken,
		client:    nil,
		user:      serviceAccountUser,
	}
}

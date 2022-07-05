using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bloki.migrations
{
   public partial class initial : Migration
   {
      protected override void Up(MigrationBuilder migrationBuilder)
      {
         migrationBuilder.CreateTable(
             name: "AspNetRoles",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetRoles", x => x.Id);
             });

         migrationBuilder.CreateTable(
             name: "Workspaces",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                Title = table.Column<string>(type: "TEXT", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_Workspaces", x => x.Id);
             });

         migrationBuilder.CreateTable(
             name: "AspNetRoleClaims",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                RoleId = table.Column<int>(type: "INTEGER", nullable: false),
                ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                table.ForeignKey(
                       name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                       column: x => x.RoleId,
                       principalTable: "AspNetRoles",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "Documents",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false),
                WorkspaceId = table.Column<int>(type: "INTEGER", nullable: false),
                Title = table.Column<string>(type: "TEXT", nullable: false),
                Shared = table.Column<bool>(type: "INTEGER", nullable: false),
                Blob = table.Column<byte[]>(type: "BLOB", nullable: false),
                LayoutOptions_FGridWidth = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_FGridHeight = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_MGridWidth = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_MGridHeight = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_Gap = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_Size = table.Column<int>(type: "INTEGER", nullable: false),
                LayoutOptions_ShowGridGradient = table.Column<bool>(type: "INTEGER", nullable: false),
                LayoutOptions_ShowResizeAreas = table.Column<bool>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_Documents", x => x.Id);
                table.ForeignKey(
                       name: "FK_Documents_Workspaces_WorkspaceId",
                       column: x => x.WorkspaceId,
                       principalTable: "Workspaces",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "Block",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                DocumentId = table.Column<int>(type: "INTEGER", nullable: false),
                type = table.Column<int>(type: "INTEGER", nullable: false),
                Url = table.Column<string>(type: "TEXT", nullable: true),
                Value = table.Column<string>(type: "TEXT", nullable: true),
                TextType = table.Column<int>(type: "INTEGER", nullable: true),
                FontFamily = table.Column<int>(type: "INTEGER", nullable: true),
                X = table.Column<int>(type: "INTEGER", nullable: false),
                Y = table.Column<int>(type: "INTEGER", nullable: false),
                Width = table.Column<int>(type: "INTEGER", nullable: false),
                Height = table.Column<int>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_Block", x => x.Id);
                table.ForeignKey(
                       name: "FK_Block_Documents_DocumentId",
                       column: x => x.DocumentId,
                       principalTable: "Documents",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "Users",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                SelectedDocumentId = table.Column<int>(type: "INTEGER", nullable: false),
                SelectedWorkspaceId = table.Column<int>(type: "INTEGER", nullable: false),
                Locale = table.Column<string>(type: "TEXT", nullable: false),
                GridRenderMethod = table.Column<string>(type: "TEXT", nullable: false),
                UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_Users", x => x.Id);
                table.ForeignKey(
                       name: "FK_Users_Documents_SelectedDocumentId",
                       column: x => x.SelectedDocumentId,
                       principalTable: "Documents",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                       name: "FK_Users_Workspaces_SelectedWorkspaceId",
                       column: x => x.SelectedWorkspaceId,
                       principalTable: "Workspaces",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "AspNetUserClaims",
             columns: table => new
             {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                     .Annotation("Sqlite:Autoincrement", true),
                UserId = table.Column<int>(type: "INTEGER", nullable: false),
                ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                table.ForeignKey(
                       name: "FK_AspNetUserClaims_Users_UserId",
                       column: x => x.UserId,
                       principalTable: "Users",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "AspNetUserLogins",
             columns: table => new
             {
                LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                UserId = table.Column<int>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                table.ForeignKey(
                       name: "FK_AspNetUserLogins_Users_UserId",
                       column: x => x.UserId,
                       principalTable: "Users",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "AspNetUserRoles",
             columns: table => new
             {
                UserId = table.Column<int>(type: "INTEGER", nullable: false),
                RoleId = table.Column<int>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                table.ForeignKey(
                       name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                       column: x => x.RoleId,
                       principalTable: "AspNetRoles",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                       name: "FK_AspNetUserRoles_Users_UserId",
                       column: x => x.UserId,
                       principalTable: "Users",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "AspNetUserTokens",
             columns: table => new
             {
                UserId = table.Column<int>(type: "INTEGER", nullable: false),
                LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                Name = table.Column<string>(type: "TEXT", nullable: false),
                Value = table.Column<string>(type: "TEXT", nullable: true)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                table.ForeignKey(
                       name: "FK_AspNetUserTokens_Users_UserId",
                       column: x => x.UserId,
                       principalTable: "Users",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateTable(
             name: "UserWorkspace",
             columns: table => new
             {
                UsersId = table.Column<int>(type: "INTEGER", nullable: false),
                WorkspacesId = table.Column<int>(type: "INTEGER", nullable: false)
             },
             constraints: table =>
             {
                table.PrimaryKey("PK_UserWorkspace", x => new { x.UsersId, x.WorkspacesId });
                table.ForeignKey(
                       name: "FK_UserWorkspace_Users_UsersId",
                       column: x => x.UsersId,
                       principalTable: "Users",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                       name: "FK_UserWorkspace_Workspaces_WorkspacesId",
                       column: x => x.WorkspacesId,
                       principalTable: "Workspaces",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
             });

         migrationBuilder.CreateIndex(
             name: "IX_AspNetRoleClaims_RoleId",
             table: "AspNetRoleClaims",
             column: "RoleId");

         migrationBuilder.CreateIndex(
             name: "RoleNameIndex",
             table: "AspNetRoles",
             column: "NormalizedName",
             unique: true);

         migrationBuilder.CreateIndex(
             name: "IX_AspNetUserClaims_UserId",
             table: "AspNetUserClaims",
             column: "UserId");

         migrationBuilder.CreateIndex(
             name: "IX_AspNetUserLogins_UserId",
             table: "AspNetUserLogins",
             column: "UserId");

         migrationBuilder.CreateIndex(
             name: "IX_AspNetUserRoles_RoleId",
             table: "AspNetUserRoles",
             column: "RoleId");

         migrationBuilder.CreateIndex(
             name: "IX_Block_DocumentId",
             table: "Block",
             column: "DocumentId");

         migrationBuilder.CreateIndex(
             name: "IX_Documents_WorkspaceId",
             table: "Documents",
             column: "WorkspaceId");

         migrationBuilder.CreateIndex(
             name: "EmailIndex",
             table: "Users",
             column: "NormalizedEmail");

         migrationBuilder.CreateIndex(
             name: "IX_Users_SelectedDocumentId",
             table: "Users",
             column: "SelectedDocumentId");

         migrationBuilder.CreateIndex(
             name: "IX_Users_SelectedWorkspaceId",
             table: "Users",
             column: "SelectedWorkspaceId");

         migrationBuilder.CreateIndex(
             name: "UserNameIndex",
             table: "Users",
             column: "NormalizedUserName",
             unique: true);

         migrationBuilder.CreateIndex(
             name: "IX_UserWorkspace_WorkspacesId",
             table: "UserWorkspace",
             column: "WorkspacesId");
      }

      protected override void Down(MigrationBuilder migrationBuilder)
      {
         migrationBuilder.DropTable(
             name: "AspNetRoleClaims");

         migrationBuilder.DropTable(
             name: "AspNetUserClaims");

         migrationBuilder.DropTable(
             name: "AspNetUserLogins");

         migrationBuilder.DropTable(
             name: "AspNetUserRoles");

         migrationBuilder.DropTable(
             name: "AspNetUserTokens");

         migrationBuilder.DropTable(
             name: "Block");

         migrationBuilder.DropTable(
             name: "UserWorkspace");

         migrationBuilder.DropTable(
             name: "AspNetRoles");

         migrationBuilder.DropTable(
             name: "Users");

         migrationBuilder.DropTable(
             name: "Documents");

         migrationBuilder.DropTable(
             name: "Workspaces");
      }
   }
}

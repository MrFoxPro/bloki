CREATE MIGRATION m1s4bbofr2ptyylkieqntdoxaxbgoogb7tloamdsmqrwmk3pujyd4q
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
  CREATE TYPE default::User {
      CREATE REQUIRED PROPERTY email -> std::str;
  };
};
